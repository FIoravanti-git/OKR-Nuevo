"use client";

import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import type { StrategicObjectiveStatus, UserRole } from "@/generated/prisma";
import { formatDate, strategicObjectiveStatusLabel } from "@/lib/format";
import type {
  InstitutionalObjectiveFilterOption,
  StrategicObjectiveAdminRow,
} from "@/types/strategic-objective-admin";
import { AnimatedProgressBar } from "@/components/ui/animated-progress-bar";
import { StrategicObjectiveRowActions } from "./strategic-objective-row-actions";
import { cn } from "@/lib/utils";

type CompanyOption = { id: string; name: string };
type ProjectOption = { id: string; title: string };

type StrategicObjectivesTableProps = {
  data: StrategicObjectiveAdminRow[];
  viewerRole: UserRole;
  canMutate: boolean;
  companies: CompanyOption[];
  projects: ProjectOption[];
  institutionalObjectives: InstitutionalObjectiveFilterOption[];
  initialProjectId?: string;
  initialInstitutionalObjectiveId?: string;
};

function formatProgress(p: number | null): string {
  if (p == null || Number.isNaN(p)) return "—";
  return `${Number(p).toFixed(1)}%`;
}

function ProgressColumn({ value }: { value: number | null }) {
  if (value == null || Number.isNaN(value)) {
    return (
      <div className="flex min-w-[120px] flex-col gap-1">
        <span className="text-sm text-muted-foreground">—</span>
        <AnimatedProgressBar value={null} className="max-w-[140px]" />
      </div>
    );
  }
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className="flex min-w-[130px] flex-col gap-1">
      <span className="text-sm font-medium tabular-nums text-foreground">{formatProgress(v)}</span>
      <AnimatedProgressBar value={v} className="max-w-[140px]" />
      <span className="text-[10px] leading-tight text-muted-foreground">Ponderado por KRs</span>
    </div>
  );
}

const globalFilterFn: FilterFn<StrategicObjectiveAdminRow> = (row, _c, filterValue) => {
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
    r.companyName,
    strategicObjectiveStatusLabel(r.status),
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
};

const selectClass =
  "h-9 min-w-[140px] rounded-lg border border-border/80 bg-background px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30";

function statusBadge(status: StrategicObjectiveStatus) {
  if (status === "ACTIVE") {
    return (
      <Badge className="border-emerald-500/20 bg-emerald-500/10 font-normal text-emerald-800 dark:text-emerald-200">
        {strategicObjectiveStatusLabel(status)}
      </Badge>
    );
  }
  if (status === "AT_RISK") {
    return (
      <Badge className="border-amber-500/25 bg-amber-500/10 font-normal text-amber-900 dark:text-amber-100">
        {strategicObjectiveStatusLabel(status)}
      </Badge>
    );
  }
  if (status === "COMPLETED") {
    return (
      <Badge className="border-sky-500/20 bg-sky-500/10 font-normal text-sky-900 dark:text-sky-100">
        {strategicObjectiveStatusLabel(status)}
      </Badge>
    );
  }
  if (status === "CANCELLED") {
    return (
      <Badge variant="secondary" className="font-normal text-muted-foreground">
        {strategicObjectiveStatusLabel(status)}
      </Badge>
    );
  }
  return <Badge variant="outline" className="font-normal">{strategicObjectiveStatusLabel(status)}</Badge>;
}

export function StrategicObjectivesTable({
  data,
  viewerRole,
  canMutate,
  companies,
  projects,
  institutionalObjectives,
  initialProjectId,
  initialInstitutionalObjectiveId,
}: StrategicObjectivesTableProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | StrategicObjectiveStatus>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>(() => {
    if (initialProjectId && projects.some((p) => p.id === initialProjectId)) return initialProjectId;
    return "all";
  });
  const [institutionalObjectiveFilter, setInstitutionalObjectiveFilter] = useState<string>(() => {
    if (
      initialInstitutionalObjectiveId &&
      institutionalObjectives.some((o) => o.id === initialInstitutionalObjectiveId)
    ) {
      return initialInstitutionalObjectiveId;
    }
    return "all";
  });

  const objectiveOptionsFiltered = useMemo(() => {
    if (projectFilter === "all") return institutionalObjectives;
    return institutionalObjectives.filter((o) => o.institutionalProjectId === projectFilter);
  }, [institutionalObjectives, projectFilter]);

  const filtered = useMemo(() => {
    return data.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (viewerRole === "SUPER_ADMIN" && companyFilter !== "all" && row.companyId !== companyFilter) {
        return false;
      }
      if (projectFilter !== "all" && row.institutionalProjectId !== projectFilter) return false;
      if (institutionalObjectiveFilter !== "all" && row.institutionalObjectiveId !== institutionalObjectiveFilter) {
        return false;
      }
      return true;
    });
  }, [data, statusFilter, companyFilter, projectFilter, institutionalObjectiveFilter, viewerRole]);

  const columns = useMemo<ColumnDef<StrategicObjectiveAdminRow>[]>(
    () => [
      {
        accessorKey: "sortOrder",
        header: "#",
        cell: ({ getValue }) => <span className="tabular-nums text-muted-foreground">{String(getValue())}</span>,
      },
      {
        accessorKey: "title",
        header: "Objetivo clave",
        cell: ({ row }) => (
          <div className="flex min-w-0 max-w-md flex-col gap-0.5">
            <span className="truncate font-medium">{row.original.title}</span>
            <span className="truncate text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">{row.original.projectTitle}</span>
              <span className="mx-1 text-muted-foreground/70">›</span>
              <span>{row.original.institutionalObjectiveTitle}</span>
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
            } satisfies ColumnDef<StrategicObjectiveAdminRow>,
          ]
        : []),
      {
        accessorKey: "weight",
        header: "Peso",
        cell: ({ getValue }) => <span className="tabular-nums text-sm">{String(getValue())}</span>,
      },
      {
        accessorKey: "progressCached",
        header: "Progreso",
        cell: ({ row }) => <ProgressColumn value={row.original.progressCached} />,
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => statusBadge(row.original.status),
      },
      {
        accessorKey: "keyResultCount",
        header: "KRs",
        cell: ({ row, getValue }) => {
          const n = Number(getValue());
          const sid = row.original.id;
          if (n > 0) {
            return (
              <Link
                href={`/resultados-clave?objetivoClave=${sid}`}
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
            <StrategicObjectiveRowActions
              strategicId={row.original.id}
              currentStatus={row.original.status}
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
      <div className="rounded-lg border border-border/80 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Jerarquía</p>
        <p className="mt-1">
          Proyecto institucional → Objetivo institucional → <span className="text-foreground">Objetivo clave</span> →
          Resultado clave.
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
              <option value="ACTIVE">Activo</option>
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
                setInstitutionalObjectiveFilter((prev) => {
                  if (v === "all") return prev;
                  const o = institutionalObjectives.find((x) => x.id === prev);
                  if (o && o.institutionalProjectId !== v) return "all";
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
              value={institutionalObjectiveFilter}
              onChange={(e) => setInstitutionalObjectiveFilter(e.target.value)}
              aria-label="Filtrar por objetivo institucional"
            >
              <option value="all">Todos</option>
              {objectiveOptionsFiltered.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.projectTitle} › {o.title}
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
        filterPlaceholder="Buscar por nombre, proyecto, objetivo institucional o estado…"
        globalFilterFn={globalFilterFn}
      />
    </div>
  );
}
