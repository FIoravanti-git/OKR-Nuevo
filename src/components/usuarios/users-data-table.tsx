"use client";

import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/generated/prisma";
import { formatDate, roleLabel } from "@/lib/format";
import type { UserAdminRow } from "@/types/user-admin";
import { UserRowActions } from "./user-row-actions";
import { cn } from "@/lib/utils";

type CompanyOption = { id: string; name: string };

type UsersDataTableProps = {
  data: UserAdminRow[];
  viewerRole: UserRole;
  viewerId: string;
  viewerCanMutate: boolean;
  companies: CompanyOption[];
};

const usersGlobalFilterFn: FilterFn<UserAdminRow> = (row, _columnId, filterValue) => {
  const q = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  const r = row.original;
  return [r.name, r.email, r.companyName ?? "", r.areaName ?? "", roleLabel(r.role)]
    .join(" ")
    .toLowerCase()
    .includes(q);
};

const selectClass =
  "h-9 min-w-[140px] rounded-lg border border-border/80 bg-background px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30";

export function UsersDataTable({ data, viewerRole, viewerId, viewerCanMutate, companies }: UsersDataTableProps) {
  const [estado, setEstado] = useState<"all" | "active" | "inactive">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (estado === "active" && !row.isActive) return false;
      if (estado === "inactive" && row.isActive) return false;
      if (roleFilter !== "all" && row.role !== roleFilter) return false;
      if (viewerRole === "SUPER_ADMIN" && companyFilter !== "all") {
        if (companyFilter === "__none__" && row.companyId) return false;
        if (companyFilter !== "__none__" && row.companyId !== companyFilter) return false;
      }
      return true;
    });
  }, [data, estado, roleFilter, companyFilter, viewerRole]);

  const columns = useMemo<ColumnDef<UserAdminRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Usuario",
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium">{row.original.name}</span>
            <span className="truncate text-xs text-muted-foreground">{row.original.email}</span>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Rol",
        cell: ({ row }) => (
          <Badge variant="secondary" className="max-w-[200px] truncate font-normal">
            {roleLabel(row.original.role)}
          </Badge>
        ),
      },
      {
        accessorKey: "areaName",
        header: "Área",
        cell: ({ row }) => (
          <span className="max-w-[180px] truncate text-sm text-muted-foreground">
            {row.original.areaName ?? "—"}
          </span>
        ),
      },
      ...(viewerRole === "SUPER_ADMIN"
        ? [
            {
              accessorKey: "companyName",
              header: "Empresa",
              cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                  {row.original.companyName ?? (
                    <span className="italic text-muted-foreground/80">Global / plataforma</span>
                  )}
                </span>
              ),
            } satisfies ColumnDef<UserAdminRow>,
          ]
        : []),
      {
        accessorKey: "isActive",
        header: "Estado",
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge className="border-emerald-500/20 bg-emerald-500/10 font-normal text-emerald-800 dark:text-emerald-200">
              Activo
            </Badge>
          ) : (
            <Badge variant="secondary" className="font-normal text-muted-foreground">
              Inactivo
            </Badge>
          ),
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
            <UserRowActions
              userId={row.original.id}
              isActive={row.original.isActive}
              viewerId={viewerId}
              canDelete={row.original.canDelete}
              viewerCanMutate={viewerCanMutate}
            />
          </div>
        ),
        enableSorting: false,
      },
    ],
    [viewerRole, viewerId, viewerCanMutate]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">Estado</span>
            <select
              className={selectClass}
              value={estado}
              onChange={(e) => setEstado(e.target.value as typeof estado)}
              aria-label="Filtrar por estado"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">Rol</span>
            <select
              className={selectClass}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
              aria-label="Filtrar por rol"
            >
              <option value="all">Todos</option>
              <option value="SUPER_ADMIN">Super administrador</option>
              <option value="ADMIN_EMPRESA">Admin empresa</option>
              <option value="OPERADOR">Operador</option>
            </select>
          </label>
          {viewerRole === "SUPER_ADMIN" ? (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">Empresa</span>
              <select
                className={cn(selectClass, "min-w-[200px]")}
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                aria-label="Filtrar por empresa"
              >
                <option value="all">Todas</option>
                <option value="__none__">Sin empresa (global)</option>
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
        data={filteredData}
        filterPlaceholder="Buscar por nombre, correo, rol o empresa…"
        globalFilterFn={usersGlobalFilterFn}
      />
    </div>
  );
}
