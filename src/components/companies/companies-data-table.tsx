"use client";

import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { CompanyTableRow } from "@/types/company";
import { CompanyRowActions } from "./company-row-actions";
import { cn } from "@/lib/utils";

type CompaniesDataTableProps = {
  data: CompanyTableRow[];
};

const companiesGlobalFilterFn: FilterFn<CompanyTableRow> = (row, _columnId, filterValue) => {
  const q = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  const r = row.original;
  return [r.name, r.slug, r.ruc ?? "", r.email ?? "", r.phone ?? "", r.planName]
    .join(" ")
    .toLowerCase()
    .includes(q);
};

const selectClass =
  "h-9 min-w-[140px] rounded-lg border border-border/80 bg-background px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30";

export function CompaniesDataTable({ data }: CompaniesDataTableProps) {
  const [estado, setEstado] = useState<"all" | "active" | "inactive">("all");
  const [planId, setPlanId] = useState<string>("all");

  const planOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of data) {
      if (row.planId) map.set(row.planId, row.planName);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (estado === "active" && !row.isActive) return false;
      if (estado === "inactive" && row.isActive) return false;
      if (planId === "__none__" && row.planId) return false;
      if (planId !== "all" && planId !== "__none__" && row.planId !== planId) return false;
      return true;
    });
  }, [data, estado, planId]);

  const columns = useMemo<ColumnDef<CompanyTableRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Empresa",
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium">{row.original.name}</span>
            <span className="truncate text-xs text-muted-foreground">/{row.original.slug}</span>
          </div>
        ),
      },
      {
        accessorKey: "ruc",
        header: "RUC / ID fiscal",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-muted-foreground">{String(getValue() ?? "—")}</span>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Estado",
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge className="border-emerald-500/20 bg-emerald-500/10 font-normal text-emerald-800 dark:text-emerald-200">
              Activa
            </Badge>
          ) : (
            <Badge variant="secondary" className="font-normal text-muted-foreground">
              Inactiva
            </Badge>
          ),
      },
      {
        accessorKey: "planName",
        header: "Plan",
        cell: ({ getValue }) => (
          <Badge variant="secondary" className="max-w-[160px] truncate font-normal">
            {String(getValue())}
          </Badge>
        ),
      },
      {
        accessorKey: "userCount",
        header: "Usuarios",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.userCount}
            <span className="text-muted-foreground"> / {row.original.maxUsers}</span>
          </span>
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
            <CompanyRowActions companyId={row.original.id} isActive={row.original.isActive} />
          </div>
        ),
        enableSorting: false,
      },
    ],
    []
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
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">Plan</span>
            <select
              className={cn(selectClass, "min-w-[180px]")}
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              aria-label="Filtrar por plan"
            >
              <option value="all">Todos los planes</option>
              {planOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
              <option value="__none__">Sin plan</option>
            </select>
          </label>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filteredData}
        filterPlaceholder="Buscar por nombre, slug, RUC, correo, teléfono o plan…"
        globalFilterFn={companiesGlobalFilterFn}
      />
    </div>
  );
}
