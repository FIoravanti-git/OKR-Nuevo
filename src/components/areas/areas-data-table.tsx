"use client";

import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { areaStatusLabel, formatDate } from "@/lib/format";
import type { AreaTableRow } from "@/types/area-admin";
import type { UserRole } from "@/generated/prisma";
import { AreaRowActions } from "./area-row-actions";

type AreasDataTableProps = {
  data: AreaTableRow[];
  viewerRole: UserRole;
  viewerCanMutate: boolean;
};

const areasGlobalFilterFn: FilterFn<AreaTableRow> = (row, _columnId, filterValue) => {
  const q = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  const r = row.original;
  return [r.name, r.description ?? "", r.companyName, r.responsablesLabel]
    .join(" ")
    .toLowerCase()
    .includes(q);
};

export function AreasDataTable({ data, viewerRole, viewerCanMutate }: AreasDataTableProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | "ACTIVE" | "INACTIVE">("all");

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      return true;
    });
  }, [data, statusFilter]);

  const columns = useMemo<ColumnDef<AreaTableRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Área",
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link
              href={`/areas/${row.original.id}`}
              className="truncate font-medium text-primary underline-offset-4 hover:underline"
            >
              {row.original.name}
            </Link>
            {row.original.description ? (
              <span className="line-clamp-1 text-xs text-muted-foreground">{row.original.description}</span>
            ) : null}
          </div>
        ),
      },
      ...(viewerRole === "SUPER_ADMIN"
        ? [
            {
              accessorKey: "companyName",
              header: "Empresa",
              cell: ({ row }: { row: { original: AreaTableRow } }) => (
                <span className="text-sm text-muted-foreground">{row.original.companyName}</span>
              ),
            } satisfies ColumnDef<AreaTableRow>,
          ]
        : []),
      {
        accessorKey: "responsablesLabel",
        header: "Responsables",
        cell: ({ row }) =>
          row.original.responsablesLabel ? (
            <span className="line-clamp-2 text-sm text-foreground">{row.original.responsablesLabel}</span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "memberCount",
        header: "Miembros",
        cell: ({ row }) => (
          <span className="tabular-nums text-sm text-muted-foreground">{row.original.memberCount}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "ACTIVE" ? "secondary" : "outline"} className="font-normal">
            {areaStatusLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        id: "created",
        header: "Alta",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <AreaRowActions
            areaId={row.original.id}
            canDelete={row.original.canDelete}
            viewerCanMutate={viewerCanMutate}
          />
        ),
      },
    ],
    [viewerRole, viewerCanMutate]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Estado</span>
          <select
            className="h-9 rounded-lg border border-border/80 bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="all">Todos</option>
            <option value="ACTIVE">Activas</option>
            <option value="INACTIVE">Inactivas</option>
          </select>
        </label>
      </div>
      <DataTable
        columns={columns}
        data={filteredData}
        filterPlaceholder="Buscar por nombre, empresa o responsables…"
        globalFilterFn={areasGlobalFilterFn}
      />
    </div>
  );
}
