"use client";

import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import type { InstitutionalObjectiveStatus, UserRole } from "@/generated/prisma";
import { formatDate, institutionalObjectiveStatusLabel } from "@/lib/format";
import type { InstitutionalObjectiveAdminRow } from "@/types/institutional-objective-admin";
import { AnimatedProgressBar } from "@/components/ui/animated-progress-bar";
import { InstitutionalObjectiveRowActions } from "./institutional-objective-row-actions";
import { cn } from "@/lib/utils";

type CompanyOption = { id: string; name: string };
type ProjectOption = { id: string; title: string };

type InstitutionalObjectivesTableProps = {
  data: InstitutionalObjectiveAdminRow[];
  viewerRole: UserRole;
  canMutate: boolean;
  companies: CompanyOption[];
  projects: ProjectOption[];
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
    </div>
  );
}

const globalFilterFn: FilterFn<InstitutionalObjectiveAdminRow> = (row, _c, filterValue) => {
  const q = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  const r = row.original;
  return [
    r.title,
    r.description ?? "",
    r.projectTitle,
    r.companyName,
    institutionalObjectiveStatusLabel(r.status),
    r.includedInGeneralProgress ? "" : "no impacta avance general seguimiento",
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
};

const selectClass =
  "h-9 min-w-[140px] rounded-lg border border-border/80 bg-background px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30";

function statusBadge(status: InstitutionalObjectiveStatus) {
  if (status === "ACTIVE") {
    return (
      <Badge className="border-emerald-500/20 bg-emerald-500/10 font-normal text-emerald-800 dark:text-emerald-200">
        {institutionalObjectiveStatusLabel(status)}
      </Badge>
    );
  }
  if (status === "COMPLETED") {
    return (
      <Badge className="border-sky-500/20 bg-sky-500/10 font-normal text-sky-900 dark:text-sky-100">
        {institutionalObjectiveStatusLabel(status)}
      </Badge>
    );
  }
  if (status === "CANCELLED") {
    return (
      <Badge variant="secondary" className="font-normal text-muted-foreground">
        {institutionalObjectiveStatusLabel(status)}
      </Badge>
    );
  }
  return <Badge variant="outline" className="font-normal">{institutionalObjectiveStatusLabel(status)}</Badge>;
}

export function InstitutionalObjectivesTable({
  data,
  viewerRole,
  canMutate,
  companies,
  projects,
}: InstitutionalObjectivesTableProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | InstitutionalObjectiveStatus>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return data.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (viewerRole === "SUPER_ADMIN" && companyFilter !== "all" && row.companyId !== companyFilter) {
        return false;
      }
      if (projectFilter !== "all" && row.institutionalProjectId !== projectFilter) return false;
      return true;
    });
  }, [data, statusFilter, companyFilter, projectFilter, viewerRole]);

  const columns = useMemo<ColumnDef<InstitutionalObjectiveAdminRow>[]>(
    () => [
      {
        accessorKey: "sortOrder",
        header: "#",
        cell: ({ getValue }) => <span className="tabular-nums text-muted-foreground">{String(getValue())}</span>,
      },
      {
        accessorKey: "title",
        header: "Objetivo",
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-medium">{row.original.title}</span>
            <span className="truncate text-xs text-muted-foreground">{row.original.projectTitle}</span>
            {!row.original.includedInGeneralProgress ? (
              <Badge variant="secondary" className="w-fit max-w-full whitespace-normal text-[11px] font-normal">
                No impacta en el avance general
              </Badge>
            ) : null}
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
            } satisfies ColumnDef<InstitutionalObjectiveAdminRow>,
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
        accessorKey: "strategicCount",
        header: "Obj. clave",
        cell: ({ row, getValue }) => {
          const n = Number(getValue());
          const oid = row.original.id;
          if (n > 0) {
            return (
              <Link
                href={`/objetivos-clave?objetivoInstitucional=${oid}`}
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
            <InstitutionalObjectiveRowActions
              objectiveId={row.original.id}
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
              <option value="COMPLETED">Completado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Proyecto</span>
            <select
              className={cn(selectClass, "min-w-[200px]")}
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
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
        filterPlaceholder="Buscar por nombre, proyecto, empresa o estado…"
        globalFilterFn={globalFilterFn}
      />
    </div>
  );
}
