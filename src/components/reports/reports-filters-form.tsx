import Link from "next/link";
import type { SessionUser } from "@/lib/auth/session-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportFilters } from "@/lib/reports/types";

type CompanyOption = { id: string; name: string };
type ProjectOption = { id: string; title: string; companyName: string };

type ReportsFiltersFormProps = {
  session: SessionUser;
  companies: CompanyOption[];
  projects: ProjectOption[];
  filters: ReportFilters;
};

function dateInputValue(d: Date | null): string {
  if (!d) return "";
  const x = new Date(d);
  const y = x.getUTCFullYear();
  const m = String(x.getUTCMonth() + 1).padStart(2, "0");
  const day = String(x.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ReportsFiltersForm({ session, companies, projects, filters }: ReportsFiltersFormProps) {
  const showCompany = session.role === "SUPER_ADMIN";

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Filtros</CardTitle>
        <CardDescription>
          El alcance respeta tu rol y empresa. Las fechas aplican a la{" "}
          <span className="font-medium text-foreground">fecha de creación</span> de las actividades en los bloques
          operativos; el avance OKR es la instantánea actual (`progress_cached`).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form method="get" action="/reportes" className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {showCompany ? (
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-foreground">Empresa</span>
                <select
                  name="companyId"
                  defaultValue={filters.companyId ?? ""}
                  className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="">Todas (vista consolidada)</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
              <span className="font-medium text-foreground">Proyecto institucional</span>
              <select
                name="projectId"
                defaultValue={filters.projectId ?? ""}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">Todos en alcance</option>
                {showCompany
                  ? projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.companyName} — {p.title}
                      </option>
                    ))
                  : projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-foreground">Estado del proyecto</span>
              <select
                name="projectStatus"
                defaultValue={filters.projectStatus ?? ""}
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">Cualquiera</option>
                <option value="DRAFT">Borrador</option>
                <option value="ACTIVE">Activo</option>
                <option value="ARCHIVED">Archivado</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-foreground">Estado de actividad</span>
              <select
                name="activityStatus"
                defaultValue={filters.activityStatus ?? ""}
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">Cualquiera</option>
                <option value="PLANNED">Planificada</option>
                <option value="IN_PROGRESS">En progreso</option>
                <option value="DONE">Hecha</option>
                <option value="BLOCKED">Bloqueada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-foreground">Desde</span>
              <input
                type="date"
                lang="es-AR"
                name="from"
                defaultValue={dateInputValue(filters.dateFrom)}
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-foreground">Hasta</span>
              <input
                type="date"
                lang="es-AR"
                name="to"
                defaultValue={dateInputValue(filters.dateTo)}
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm">
              Aplicar filtros
            </Button>
            <Button type="button" variant="outline" size="sm" render={<Link href="/reportes" />}>
              Limpiar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
