"use client";

import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import type { ActivityStatus, UserRole } from "@/generated/prisma";
import { activityOverdueLabel, activityStatusLabel, formatDate } from "@/lib/format";
import { isActivityOverdue } from "@/lib/activities/overdue";
import type { ActivityAdminRow } from "@/types/activity-admin";
import { ActivityOverdueBadge } from "./activity-overdue-badge";
import { ActivityRowActions } from "./activity-row-actions";
import { cn } from "@/lib/utils";

type AssigneeFilterOption = { id: string; name: string };

type ActivitiesTableProps = {
  data: ActivityAdminRow[];
  viewerRole: UserRole;
  canMutate: boolean;
  assigneeFilterOptions: AssigneeFilterOption[];
  initialKeyResultId?: string;
  /** Si true, al cargar solo se listan actividades vencidas (vencimiento &lt; hoy y ≠ Hecha). */
  initialOverdueOnly?: boolean;
};

function utcDay(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function parseFilterDay(s: string): number | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return Date.UTC(y, m - 1, d);
}

function formatProgress(p: number | null): string {
  if (p == null || Number.isNaN(p)) return "—";
  return `${Number(p).toFixed(0)}%`;
}

function ProgressMini({ value }: { value: number | null }) {
  if (value == null || Number.isNaN(value)) {
    return <div className="h-1.5 w-20 rounded-full bg-muted/80" />;
  }
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted/80">
      <div className="h-full rounded-full bg-primary/90" style={{ width: `${v}%` }} />
    </div>
  );
}

const globalFilterFn: FilterFn<ActivityAdminRow> = (row, _c, filterValue) => {
  const q = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  const r = row.original;
  return [
    r.title,
    r.description ?? "",
    r.keyResultTitle,
    r.projectTitle,
    r.institutionalObjectiveTitle,
    r.strategicObjectiveTitle,
    r.assigneeName ?? "",
    r.assigneeEmail ?? "",
    r.companyName,
    r.contributionWeight,
    r.dependsOnTitle ?? "",
    activityStatusLabel(r.status),
    ...(isActivityOverdue(r.dueDate, r.status) ? [activityOverdueLabel()] : []),
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
};

const selectClass =
  "h-9 min-w-[140px] rounded-lg border border-border/80 bg-background px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30";

function statusBadge(status: ActivityStatus) {
  if (status === "IN_PROGRESS") {
    return (
      <Badge className="border-sky-500/20 bg-sky-500/10 font-normal text-sky-900 dark:text-sky-100">
        {activityStatusLabel(status)}
      </Badge>
    );
  }
  if (status === "DONE") {
    return (
      <Badge className="border-emerald-500/20 bg-emerald-500/10 font-normal text-emerald-800 dark:text-emerald-200">
        {activityStatusLabel(status)}
      </Badge>
    );
  }
  if (status === "BLOCKED") {
    return (
      <Badge className="border-amber-500/25 bg-amber-500/10 font-normal text-amber-900 dark:text-amber-100">
        {activityStatusLabel(status)}
      </Badge>
    );
  }
  if (status === "CANCELLED") {
    return (
      <Badge variant="secondary" className="font-normal text-muted-foreground">
        {activityStatusLabel(status)}
      </Badge>
    );
  }
  return <Badge variant="outline" className="font-normal">{activityStatusLabel(status)}</Badge>;
}

export function ActivitiesTable({
  data,
  viewerRole,
  canMutate,
  assigneeFilterOptions,
  initialKeyResultId,
  initialOverdueOnly = false,
}: ActivitiesTableProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | ActivityStatus>("all");
  const [showOverdueOnly, setShowOverdueOnly] = useState(initialOverdueOnly);
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [krFilter, setKrFilter] = useState<string>(() =>
    initialKeyResultId && data.some((r) => r.keyResultId === initialKeyResultId) ? initialKeyResultId : "all"
  );
  const [startFrom, setStartFrom] = useState("");
  const [startTo, setStartTo] = useState("");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");

  const keyResultIds = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of data) {
      if (!m.has(r.keyResultId)) m.set(r.keyResultId, r.keyResultTitle);
    }
    return Array.from(m.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [data]);

  const filtered = useMemo(() => {
    const sf = parseFilterDay(startFrom);
    const st = parseFilterDay(startTo);
    const df = parseFilterDay(dueFrom);
    const dt = parseFilterDay(dueTo);

    return data.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (assigneeFilter !== "all") {
        if (assigneeFilter === "__unassigned__") {
          if (row.assigneeUserId != null) return false;
        } else if (row.assigneeUserId !== assigneeFilter) {
          return false;
        }
      }
      if (krFilter !== "all" && row.keyResultId !== krFilter) return false;

      if (sf != null || st != null) {
        const day = utcDay(row.startDate);
        if (day == null) return false;
        if (sf != null && day < sf) return false;
        if (st != null && day > st) return false;
      }
      if (df != null || dt != null) {
        const day = utcDay(row.dueDate);
        if (day == null) return false;
        if (df != null && day < df) return false;
        if (dt != null && day > dt) return false;
      }
      if (showOverdueOnly && !isActivityOverdue(row.dueDate, row.status)) return false;
      return true;
    });
  }, [data, statusFilter, assigneeFilter, krFilter, startFrom, startTo, dueFrom, dueTo, showOverdueOnly]);

  const columns = useMemo<ColumnDef<ActivityAdminRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Actividad",
        cell: ({ row }) => (
          <div className="flex min-w-0 max-w-xs flex-col gap-1">
            <span className="truncate font-medium">{row.original.title}</span>
            <span className="truncate text-[11px] text-muted-foreground">
              {row.original.projectTitle} › {row.original.institutionalObjectiveTitle} ›{" "}
              {row.original.strategicObjectiveTitle} › {row.original.keyResultTitle}
            </span>
          </div>
        ),
      },
      ...(viewerRole === "SUPER_ADMIN"
        ? [
            {
              accessorKey: "companyName",
              header: "Empresa",
              cell: ({ row }) => (
                <span className="truncate text-sm text-muted-foreground">{row.original.companyName}</span>
              ),
            } satisfies ColumnDef<ActivityAdminRow>,
          ]
        : []),
      {
        id: "assignee",
        header: "Responsable",
        cell: ({ row }) => (
          <div className="max-w-[140px] text-sm">
            {row.original.assigneeName ? (
              <>
                <p className="truncate font-medium">{row.original.assigneeName}</p>
                <p className="truncate text-xs text-muted-foreground">{row.original.assigneeEmail}</p>
              </>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "startDate",
        header: "Inicio",
        cell: ({ row }) =>
          row.original.startDate ? (
            <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
              {formatDate(row.original.startDate)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "dueDate",
        header: "Vence",
        cell: ({ row }) => {
          const overdue = isActivityOverdue(row.original.dueDate, row.original.status);
          return row.original.dueDate ? (
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "whitespace-nowrap text-xs tabular-nums",
                    overdue ? "font-semibold text-destructive" : "text-muted-foreground"
                  )}
                >
                  {formatDate(row.original.dueDate)}
                </span>
                {overdue ? <ActivityOverdueBadge size="compact" /> : null}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: "progressContribution",
        header: "Avance",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tabular-nums">{formatProgress(row.original.progressContribution)}</span>
            <ProgressMini value={row.original.progressContribution} />
          </div>
        ),
      },
      {
        accessorKey: "impactsProgress",
        header: "Impacta indicador",
        cell: ({ row }) =>
          row.original.impactsProgress ? (
            <Badge className="font-normal text-xs">Sí</Badge>
          ) : (
            <Badge variant="secondary" className="font-normal text-xs">
              No
            </Badge>
          ),
      },
      {
        id: "dependency",
        header: "Dependencia",
        cell: ({ row }) => {
          const r = row.original;
          if (!r.dependsOnActivityId) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          return (
            <div className="flex max-w-[220px] flex-col gap-1">
              <span className="line-clamp-2 text-xs leading-snug">{r.dependsOnTitle ?? "—"}</span>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[10px] font-normal">
                  Con dependencia
                </Badge>
                {r.blockedByDependency ? (
                  <Badge
                    variant="secondary"
                    className="border-amber-500/30 text-[10px] font-normal text-amber-950 dark:text-amber-100"
                  >
                    Bloqueada
                  </Badge>
                ) : (
                  <Badge className="text-[10px] font-normal">Cumplida</Badge>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "actualStart",
        header: "Inicio real",
        cell: ({ row }) => {
          const iso = row.original.actualStartDate;
          if (!iso) return <span className="text-xs text-muted-foreground">—</span>;
          return <span className="text-xs tabular-nums">{formatDate(iso)}</span>;
        },
      },
      {
        id: "depScheduleRisk",
        header: "Calendario",
        cell: ({ row }) => {
          const r = row.original;
          if (r.delayedStartVsPlanned) {
            return (
              <Badge variant="outline" className="text-[10px] font-normal text-amber-950 dark:text-amber-100">
                Atrasada (inicio)
              </Badge>
            );
          }
          if (r.plannedStartAtRisk) {
            return (
              <Badge variant="outline" className="text-[10px] font-normal text-amber-900 dark:text-amber-100">
                Riesgo por dep.
              </Badge>
            );
          }
          return <span className="text-xs text-muted-foreground">—</span>;
        },
      },
      {
        accessorKey: "contributionWeight",
        header: "Peso",
        cell: ({ row }) => {
          const w = row.original.contributionWeight;
          const n = Number(w);
          if (!row.original.impactsProgress || !Number.isFinite(n) || n <= 0) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          return <span className="text-xs tabular-nums">{w}</span>;
        },
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => statusBadge(row.original.status),
      },
      {
        accessorKey: "createdAt",
        header: "Alta",
        cell: ({ getValue }) => formatDate(String(getValue())),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ActivityRowActions
              activityId={row.original.id}
              activityTitle={row.original.title}
              currentStatus={row.original.status}
              currentProgress={row.original.progressContribution}
              canMutate={canMutate}
            />
          </div>
        ),
        enableSorting: false,
      },
    ],
    [viewerRole, canMutate]
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/80 bg-gradient-to-br from-muted/35 via-background to-background px-4 py-3.5">
        <p className="text-sm font-medium text-foreground">Operativa OKR</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Cada tarea está bajo un resultado clave. El avance puede sumar al indicador según impacto y peso; los cambios
          de avance quedan registrados en el historial.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 sm:items-center">
          <label className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Estado</span>
            <select
              className={selectClass}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              aria-label="Filtrar por estado"
            >
              <option value="all">Todos</option>
              <option value="PLANNED">Planificada</option>
              <option value="IN_PROGRESS">En progreso</option>
              <option value="DONE">Hecha</option>
              <option value="BLOCKED">Bloqueada</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </label>
          <label className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Responsable</span>
            <select
              className={cn(selectClass, "min-w-[200px]")}
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              aria-label="Filtrar por responsable"
            >
              <option value="all">Todos</option>
              <option value="__unassigned__">Sin asignar</option>
              {assigneeFilterOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Resultado clave</span>
            <select
              className={cn(selectClass, "min-w-[200px]")}
              value={krFilter}
              onChange={(e) => setKrFilter(e.target.value)}
              aria-label="Filtrar por resultado clave"
            >
              <option value="all">Todos</option>
              {keyResultIds.map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            role="switch"
            aria-checked={showOverdueOnly}
            onClick={() => setShowOverdueOnly((v) => !v)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              showOverdueOnly
                ? "border-rose-500/45 bg-rose-500/10 text-rose-900 dark:text-rose-100"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted/50"
            )}
          >
            Solo vencidas
          </button>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Fechas inicio</span>
          <label className="flex items-center gap-2">
            Desde
            <input
              type="date"
              lang="es-AR"
              className={cn(selectClass, "min-w-[140px]")}
              value={startFrom}
              onChange={(e) => setStartFrom(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2">
            Hasta
            <input
              type="date"
              lang="es-AR"
              className={cn(selectClass, "min-w-[140px]")}
              value={startTo}
              onChange={(e) => setStartTo(e.target.value)}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Vencimiento</span>
          <label className="flex items-center gap-2">
            Desde
            <input
              type="date"
              lang="es-AR"
              className={cn(selectClass, "min-w-[140px]")}
              value={dueFrom}
              onChange={(e) => setDueFrom(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2">
            Hasta
            <input
              type="date"
              lang="es-AR"
              className={cn(selectClass, "min-w-[140px]")}
              value={dueTo}
              onChange={(e) => setDueTo(e.target.value)}
            />
          </label>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        filterPlaceholder="Buscar por título, KR, responsable o estado…"
        globalFilterFn={globalFilterFn}
        getRowClassName={(row) =>
          isActivityOverdue(row.dueDate, row.status)
            ? "bg-rose-500/[0.06] dark:bg-rose-500/[0.09]"
            : undefined
        }
      />
    </div>
  );
}
