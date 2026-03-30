"use client";

import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import type { InstitutionalProjectStatus, UserRole } from "@/generated/prisma";
import { institutionalProjectStatusLabel } from "@/lib/format";
import type { InstitutionalProjectAdminRow } from "@/types/institutional-project-admin";
import { InstitutionalProjectRowActions } from "./institutional-project-row-actions";
import { cn } from "@/lib/utils";

type CompanyOption = { id: string; name: string };

type InstitutionalProjectsTableProps = {
  data: InstitutionalProjectAdminRow[];
  viewerRole: UserRole;
  canMutate: boolean;
  companies: CompanyOption[];
};

const globalFilterFn: FilterFn<InstitutionalProjectAdminRow> = (row, _c, filterValue) => {
  const q = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  const r = row.original;
  return [r.title, r.description ?? "", r.companyName, r.methodology ?? "", String(r.year ?? "")]
    .join(" ")
    .toLowerCase()
    .includes(q);
};

const selectClass =
  "h-9 min-w-[140px] rounded-lg border border-border/80 bg-background px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30";

function statusBadge(status: InstitutionalProjectStatus) {
  if (status === "ACTIVE") {
    return (
      <Badge className="border-emerald-500/20 bg-emerald-500/10 font-normal text-emerald-800 dark:text-emerald-200">
        {institutionalProjectStatusLabel(status)}
      </Badge>
    );
  }
  if (status === "ARCHIVED") {
    return (
      <Badge variant="secondary" className="font-normal text-muted-foreground">
        {institutionalProjectStatusLabel(status)}
      </Badge>
    );
  }
  return <Badge variant="outline" className="font-normal">{institutionalProjectStatusLabel(status)}</Badge>;
}

export function InstitutionalProjectsTable({
  data,
  viewerRole,
  canMutate,
  companies,
}: InstitutionalProjectsTableProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | InstitutionalProjectStatus>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return data.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (viewerRole === "SUPER_ADMIN" && companyFilter !== "all" && row.companyId !== companyFilter) {
        return false;
      }
      return true;
    });
  }, [data, statusFilter, companyFilter, viewerRole]);

  const columns = useMemo<ColumnDef<InstitutionalProjectAdminRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Proyecto",
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium">{row.original.title}</span>
            {row.original.year ? (
              <span className="text-xs tabular-nums text-muted-foreground">Año {row.original.year}</span>
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
            } satisfies ColumnDef<InstitutionalProjectAdminRow>,
          ]
        : []),
      {
        accessorKey: "methodology",
        header: "Metodología",
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{String(getValue() ?? "—")}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => statusBadge(row.original.status),
      },
      {
        accessorKey: "objectivesCount",
        header: "Obj. inst.",
        cell: ({ getValue }) => <span className="tabular-nums">{String(getValue())}</span>,
      },
      {
        accessorKey: "createdAt",
        header: "Creado",
        cell: ({ row }) => row.original.createdAtLabel,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <InstitutionalProjectRowActions
              projectId={row.original.id}
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
              <option value="ARCHIVED">Archivado</option>
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
        filterPlaceholder="Buscar por nombre, descripción, empresa, metodología…"
        globalFilterFn={globalFilterFn}
      />
    </div>
  );
}
