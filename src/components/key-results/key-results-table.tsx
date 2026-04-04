"use client";

import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import type { KeyResultCalculationMode, KeyResultStatus, UserRole } from "@/generated/prisma";
import {
  formatDate,
  formatAmount,
  keyResultCalculationModeLabel,
  keyResultMetricTypeLabel,
  keyResultProgressHealthSearchText,
  keyResultStatusLabel,
} from "@/lib/format";
import { linearMetricProgress } from "@/lib/okr/metric-progress";
import type {
  InstitutionalObjectiveFilterOption,
  KeyResultAdminRow,
  StrategicObjectiveFilterOption,
} from "@/types/key-result-admin";
import { AnimatedProgressBar } from "@/components/ui/animated-progress-bar";
import { KeyResultRowActions } from "./key-result-row-actions";
import { KeyResultProgressHealthBadge } from "./key-result-progress-health-badge";
import { cn } from "@/lib/utils";

type CompanyOption = { id: string; name: string };
type ProjectOption = { id: string; title: string };

type KeyResultsTableProps = {
  data: KeyResultAdminRow[];
  viewerRole: UserRole;
  canMutate: boolean;
  companies: CompanyOption[];
  projects: ProjectOption[];
  institutionalObjectives: InstitutionalObjectiveFilterOption[];
  strategicObjectives: StrategicObjectiveFilterOption[];
  initialProjectId?: string;
  initialInstitutionalObjectiveId?: string;
  initialStrategicObjectiveId?: string;
};

function formatProgress(p: number | null): string {
  if (p == null || Number.isNaN(p)) return "—";
  return `${Number(p).toFixed(1)}%`;
}

function ProgressCell({ value }: { value: number | null }) {
  if (value == null || Number.isNaN(value)) {
    return (
      <div className="flex min-w-[120px] flex-col gap-1">
        <span className="text-sm text-muted-foreground">—</span>
        <AnimatedProgressBar value={null} />
      </div>
    );
  }
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className="flex min-w-[140px] flex-col gap-1">
      <span className="text-sm font-medium tabular-nums text-foreground">{formatProgress(v)}</span>
      <AnimatedProgressBar value={v} />
    </div>
  );
}

/** % derivado solo de inicial / actual / meta / dirección (modos no manuales). */
function metricProgressPercent(row: KeyResultAdminRow): number | null {
  if (row.calculationMode === "MANUAL") return null;
  return linearMetricProgress(
    row.initialValue,
    row.currentValue,
    row.targetValue,
    row.targetDirection
  );
}

function AvanceCell({ row }: { row: KeyResultAdminRow }) {
  const mp = metricProgressPercent(row);
  return (
    <div className="flex min-w-[140px] flex-col gap-0.5">
      <ProgressCell value={row.progressCached} />
      {mp != null ? (
        <span className="text-[10px] leading-tight text-muted-foreground tabular-nums">
          Por métrica: {mp.toFixed(1)}%
        </span>
      ) : null}
    </div>
  );
}

function formatMetricValue(value: number | null, metricType: string): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (metricType === "CURRENCY") return formatAmount(value);
  return String(value);
}

const globalFilterFn: FilterFn<KeyResultAdminRow> = (row, _c, filterValue) => {
  const q = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  const r = row.original;
  return [
    r.title,
    r.description ?? "",
    r.projectTitle,
    r.institutionalObjectiveTitle,
    r.strategicObjectiveTitle,
    r.companyName,
    r.areaName ?? "",
    r.areaResponsablesLabel,
    keyResultStatusLabel(r.status),
    keyResultProgressHealthSearchText(r.progressCached),
    keyResultMetricTypeLabel(r.metricType),
    keyResultCalculationModeLabel(r.calculationMode),
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
};

const selectClass =
  "h-9 min-w-[140px] rounded-lg border border-border/80 bg-background px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30";

function statusBadge(status: KeyResultStatus) {
  if (status === "ON_TRACK") {
    return (
      <Badge className="border-emerald-500/20 bg-emerald-500/10 font-normal text-emerald-800 dark:text-emerald-200">
        {keyResultStatusLabel(status)}
      </Badge>
    );
  }
  if (status === "AT_RISK") {
    return (
      <Badge className="border-amber-500/25 bg-amber-500/10 font-normal text-amber-900 dark:text-amber-100">
        {keyResultStatusLabel(status)}
      </Badge>
    );
  }
  if (status === "COMPLETED") {
    return (
      <Badge className="border-sky-500/20 bg-sky-500/10 font-normal text-sky-900 dark:text-sky-100">
        {keyResultStatusLabel(status)}
      </Badge>
    );
  }
  if (status === "CANCELLED") {
    return (
      <Badge variant="secondary" className="font-normal text-muted-foreground">
        {keyResultStatusLabel(status)}
      </Badge>
    );
  }
  return <Badge variant="outline" className="font-normal">{keyResultStatusLabel(status)}</Badge>;
}

function calcModeBadge(mode: KeyResultCalculationMode) {
  if (mode === "MANUAL") {
    return <Badge variant="outline" className="font-normal text-xs">{keyResultCalculationModeLabel(mode)}</Badge>;
  }
  if (mode === "HYBRID") {
    return (
      <Badge className="border-violet-500/20 bg-violet-500/10 font-normal text-xs text-violet-900 dark:text-violet-100">
        {keyResultCalculationModeLabel(mode)}
      </Badge>
    );
  }
  return (
    <Badge className="border-slate-500/20 bg-slate-500/10 font-normal text-xs text-slate-800 dark:text-slate-100">
      {keyResultCalculationModeLabel(mode)}
    </Badge>
  );
}

export function KeyResultsTable({
  data,
  viewerRole,
  canMutate,
  companies,
  projects,
  institutionalObjectives,
  strategicObjectives,
  initialProjectId,
  initialInstitutionalObjectiveId,
  initialStrategicObjectiveId,
}: KeyResultsTableProps) {
  const [rows, setRows] = useState<KeyResultAdminRow[]>(data);
  useEffect(() => {
    setRows(data);
  }, [data]);
  const [statusFilter, setStatusFilter] = useState<"all" | KeyResultStatus>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>(() => {
    if (initialProjectId && projects.some((p) => p.id === initialProjectId)) return initialProjectId;
    return "all";
  });
  const [ioFilter, setIoFilter] = useState<string>(() => {
    if (
      initialInstitutionalObjectiveId &&
      institutionalObjectives.some((o) => o.id === initialInstitutionalObjectiveId)
    ) {
      return initialInstitutionalObjectiveId;
    }
    return "all";
  });
  const [strategicFilter, setStrategicFilter] = useState<string>(() => {
    if (
      initialStrategicObjectiveId &&
      strategicObjectives.some((s) => s.id === initialStrategicObjectiveId)
    ) {
      return initialStrategicObjectiveId;
    }
    return "all";
  });

  const ioOptionsFiltered = useMemo(() => {
    if (projectFilter === "all") return institutionalObjectives;
    return institutionalObjectives.filter((o) => o.institutionalProjectId === projectFilter);
  }, [institutionalObjectives, projectFilter]);

  const strategicOptionsFiltered = useMemo(() => {
    let list = strategicObjectives;
    if (projectFilter !== "all") {
      list = list.filter((s) => s.institutionalProjectId === projectFilter);
    }
    if (ioFilter !== "all") {
      list = list.filter((s) => s.institutionalObjectiveId === ioFilter);
    }
    return list;
  }, [strategicObjectives, projectFilter, ioFilter]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (viewerRole === "SUPER_ADMIN" && companyFilter !== "all" && row.companyId !== companyFilter) {
        return false;
      }
      if (projectFilter !== "all" && row.institutionalProjectId !== projectFilter) return false;
      if (ioFilter !== "all" && row.institutionalObjectiveId !== ioFilter) return false;
      if (strategicFilter !== "all" && row.strategicObjectiveId !== strategicFilter) return false;
      return true;
    });
  }, [rows, statusFilter, companyFilter, projectFilter, ioFilter, strategicFilter, viewerRole]);

  function applyQuickRowUpdate(
    keyResultId: string,
    next: { currentValue: number | null; progressCached: number | null; status: KeyResultStatus }
  ) {
    setRows((prev) =>
      prev.map((row) =>
        row.id === keyResultId
          ? {
              ...row,
              currentValue: next.currentValue,
              progressCached: next.progressCached,
              status: next.status,
            }
          : row
      )
    );
  }

  const columns = useMemo<ColumnDef<KeyResultAdminRow>[]>(
    () => [
      {
        accessorKey: "sortOrder",
        header: "#",
        cell: ({ getValue }) => <span className="tabular-nums text-muted-foreground">{String(getValue())}</span>,
      },
      {
        accessorKey: "title",
        header: "Resultado clave",
        cell: ({ row }) => (
          <div className="flex min-w-0 max-w-xs flex-col gap-1">
            <span className="truncate font-medium">{row.original.title}</span>
            <span className="truncate text-[11px] leading-tight text-muted-foreground">
              <span className="font-medium text-foreground/75">{row.original.projectTitle}</span>
              <span className="mx-0.5 opacity-60">›</span>
              <span>{row.original.institutionalObjectiveTitle}</span>
              <span className="mx-0.5 opacity-60">›</span>
              <span>{row.original.strategicObjectiveTitle}</span>
            </span>
            <div className="flex flex-wrap gap-1 pt-0.5">
              <Badge variant="secondary" className="font-normal text-[10px]">
                {keyResultMetricTypeLabel(row.original.metricType)}
              </Badge>
              {calcModeBadge(row.original.calculationMode)}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "areaName",
        header: "Área",
        cell: ({ row }) => (
          <span className="max-w-[160px] truncate text-sm text-muted-foreground">
            {row.original.areaName ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "areaResponsablesLabel",
        header: "Responsables",
        cell: ({ row }) => (
          <span className="max-w-[200px] line-clamp-2 text-xs text-muted-foreground">
            {row.original.areaResponsablesLabel.trim() ? row.original.areaResponsablesLabel : "—"}
          </span>
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
            } satisfies ColumnDef<KeyResultAdminRow>,
          ]
        : []),
      {
        accessorKey: "progressCached",
        header: "Avance",
        cell: ({ row }) => <AvanceCell row={row.original} />,
      },
      {
        accessorKey: "currentValue",
        header: "Valores",
        cell: ({ row }) => (
          <div className="tabular-nums text-xs text-muted-foreground">
            <div>
              Act.:{" "}
              <span className="font-medium text-foreground">
                {formatMetricValue(row.original.currentValue, row.original.metricType)}
              </span>
            </div>
            <div>
              Meta:{" "}
              <span className="font-medium text-foreground">
                {formatMetricValue(row.original.targetValue, row.original.metricType)}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "weight",
        header: "Peso",
        cell: ({ getValue }) => <span className="tabular-nums text-sm">{String(getValue())}</span>,
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (
          <div className="flex min-w-[140px] flex-col items-start gap-1.5">
            {statusBadge(row.original.status)}
            <KeyResultProgressHealthBadge progressPercent={row.original.progressCached} size="compact" />
          </div>
        ),
      },
      {
        accessorKey: "activityCount",
        header: "Act.",
        cell: ({ row, getValue }) => {
          const n = Number(getValue());
          const kid = row.original.id;
          if (n > 0) {
            return (
              <Link
                href={`/actividades?resultadoClave=${kid}`}
                className="tabular-nums font-medium text-primary underline-offset-4 hover:underline"
              >
                {String(n)}
              </Link>
            );
          }
          return <span className="tabular-nums text-muted-foreground">0</span>;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Creado",
        cell: ({ getValue }) => formatDate(String(getValue())),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <KeyResultRowActions
              keyResultId={row.original.id}
              keyResultTitle={row.original.title}
              currentStatus={row.original.status}
              calculationMode={row.original.calculationMode}
              currentProgress={row.original.progressCached}
              currentValue={row.original.currentValue}
              initialValue={row.original.initialValue}
              targetValue={row.original.targetValue}
              unit={row.original.unit}
              metricType={row.original.metricType}
              canMutate={canMutate}
              onQuickUpdated={(next) => applyQuickRowUpdate(row.original.id, next)}
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
      <div className="rounded-xl border border-border/80 bg-gradient-to-br from-muted/40 via-background to-background px-4 py-3.5 shadow-sm">
        <p className="text-sm font-medium text-foreground">Cadena del indicador</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Cada resultado clave pertenece a un objetivo clave y hereda proyecto y empresa. El avance puede ser manual,
          automático desde métricas (inicial → meta) o híbrido combinando métricas con actividades que impacten el KR.
        </p>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Estado</span>
            <select
              className={selectClass}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              aria-label="Filtrar por estado"
            >
              <option value="all">Todos</option>
              <option value="DRAFT">Borrador</option>
              <option value="ON_TRACK">En curso</option>
              <option value="AT_RISK">En riesgo</option>
              <option value="COMPLETED">Completado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Proyecto</span>
            <select
              className={cn(selectClass, "min-w-[200px]")}
              value={projectFilter}
              onChange={(e) => {
                const v = e.target.value;
                setProjectFilter(v);
                setIoFilter((prev) => {
                  if (v === "all") return prev;
                  const o = institutionalObjectives.find((x) => x.id === prev);
                  if (o && o.institutionalProjectId !== v) return "all";
                  return prev;
                });
                setStrategicFilter((prev) => {
                  if (v === "all") return prev;
                  const s = strategicObjectives.find((x) => x.id === prev);
                  if (s && s.institutionalProjectId !== v) return "all";
                  return prev;
                });
              }}
              aria-label="Filtrar por proyecto"
            >
              <option value="all">Todos</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Obj. institucional</span>
            <select
              className={cn(selectClass, "min-w-[220px]")}
              value={ioFilter}
              onChange={(e) => {
                const v = e.target.value;
                setIoFilter(v);
                setStrategicFilter((prev) => {
                  if (v === "all") return prev;
                  const s = strategicObjectives.find((x) => x.id === prev);
                  if (s && s.institutionalObjectiveId !== v) return "all";
                  return prev;
                });
              }}
              aria-label="Filtrar por objetivo institucional"
            >
              <option value="all">Todos</option>
              {ioOptionsFiltered.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.projectTitle} › {o.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Objetivo clave</span>
            <select
              className={cn(selectClass, "min-w-[220px]")}
              value={strategicFilter}
              onChange={(e) => setStrategicFilter(e.target.value)}
              aria-label="Filtrar por objetivo clave"
            >
              <option value="all">Todos</option>
              {strategicOptionsFiltered.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.projectTitle} › {s.title}
                </option>
              ))}
            </select>
          </label>
          {viewerRole === "SUPER_ADMIN" ? (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Empresa</span>
              <select
                className={cn(selectClass, "min-w-[200px]")}
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                aria-label="Filtrar por empresa"
              >
                <option value="all">Todas</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        filterPlaceholder="Buscar por nombre, jerarquía, área, métrica o modo…"
        globalFilterFn={globalFilterFn}
      />
    </div>
  );
}
