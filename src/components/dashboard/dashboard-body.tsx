import {
  Activity,
  Building2,
  CalendarClock,
  ClipboardList,
  FolderKanban,
  KeyRound,
  ListTodo,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { UserRole } from "@/generated/prisma";
import { ExecutiveDashboardSection } from "@/components/dashboard/executive-dashboard-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompanyDashboardChartsPayload, PlatformDashboardChartsPayload } from "@/lib/dashboard/charts-data";
import type { CompanyExecutiveDashboard } from "@/lib/dashboard/executive";
import type { DashboardStats } from "@/lib/dashboard/stats";
import { roleLabel } from "@/lib/format";
import { AreaPerformanceSection } from "./area-performance-section";
import { CompanyDashboardCharts, DashboardKeyResultsRankingCard } from "./company-dashboard-charts";
import { PlatformDashboardCharts } from "./platform-dashboard-charts";
import { QuarterlyGanttSection } from "./quarterly-gantt-section";
import { MetricCard } from "./metric-card";
import { OperatorRecentProgress } from "./operator-recent-progress";

function nf(n: number): string {
  return n.toLocaleString("es");
}

type DashboardBodyProps = {
  stats: DashboardStats;
  executive: CompanyExecutiveDashboard | null;
  companyName: string | null;
  role: UserRole;
  companyCharts: CompanyDashboardChartsPayload | null;
  platformCharts: PlatformDashboardChartsPayload | null;
};

export function DashboardBody({
  stats,
  executive,
  companyName,
  role,
  companyCharts,
  platformCharts,
}: DashboardBodyProps) {
  if (stats.kind === "SUPER_ADMIN") {
    return (
      <div className="flex flex-col gap-8">
        <section aria-labelledby="dash-kpis-global">
          <h2 id="dash-kpis-global" className="sr-only">
            Indicadores globales de la plataforma
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <MetricCard
              icon={Building2}
              label="Empresas"
              value={nf(stats.companies)}
              description="Organizaciones registradas en el sistema."
              href="/companies"
            />
            <MetricCard
              icon={Users}
              label="Usuarios"
              value={nf(stats.users)}
              description="Total de cuentas de usuario en la plataforma."
              href="/usuarios"
            />
            <MetricCard
              icon={FolderKanban}
              label="Proyectos institucionales"
              value={nf(stats.institutionalProjects)}
              description="Proyectos raíz por organización (varios por empresa)."
              href="/proyecto"
            />
            <MetricCard
              icon={Target}
              label="Objetivos institucionales"
              value={nf(stats.institutionalObjectives)}
              description="Macro-objetivos bajo proyectos institucionales."
              href="/objetivos"
            />
            <MetricCard
              icon={KeyRound}
              label="Resultados clave"
              value={nf(stats.keyResults)}
              description="Indicadores (KR) bajo objetivos clave."
              href="/resultados-clave"
            />
            <MetricCard
              icon={Activity}
              label="Actividades"
              value={nf(stats.activities)}
              description="Tareas operativas bajo resultados clave."
              href="/actividades"
            />
            <MetricCard
              icon={CalendarClock}
              label="Actividades vencidas"
              value={
                <span className={stats.activitiesOverdue > 0 ? "text-destructive" : undefined}>
                  {nf(stats.activitiesOverdue)}
                </span>
              }
              description="Vencimiento anterior a hoy y estado distinto de Hecha (plataforma completa)."
              href="/actividades?vencidas=1"
            />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-5" aria-labelledby="dash-charts-global">
          <div className="lg:col-span-3">
            {platformCharts ? <PlatformDashboardCharts stats={stats} charts={platformCharts} /> : null}
          </div>
          <Card className="border-border/80 bg-card/60 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Contexto</CardTitle>
              <CardDescription>
                Rol actual: <span className="font-medium text-foreground">{roleLabel(role)}</span>. Los totales incluyen
                todas las empresas; la separación por organización se aplica en módulos operativos.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Desde <span className="font-medium text-foreground">Empresas</span> y{" "}
                <span className="font-medium text-foreground">Usuarios</span> podés administrar el catálogo global.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }

  if (stats.kind === "ADMIN_EMPRESA") {
    const noCompany = !stats.companyId;
    const openTotal = stats.activitiesPlanned + stats.activitiesInProgress;

    return (
      <div className="flex flex-col gap-8">
        {noCompany ? (
          <Card className="border-amber-500/30 bg-amber-500/[0.06] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-amber-950 dark:text-amber-100">Sin empresa asignada</CardTitle>
              <CardDescription className="text-amber-900/80 dark:text-amber-100/80">
                Tu usuario no tiene una empresa asignada. Contactá a un super administrador para vincularte a una
                organización.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {stats.companyId && executive ? (
          <ExecutiveDashboardSection data={executive} companyName={companyName} />
        ) : null}

        <section aria-labelledby="dash-kpis-tenant">
          <h2 id="dash-kpis-tenant" className="sr-only">
            Indicadores de tu empresa
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Datos filtrados por empresa: <span className="font-medium text-foreground">{companyName ?? "—"}</span>
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              icon={FolderKanban}
              label="Proyecto institucional"
              value={nf(stats.institutionalProjects)}
              description="Proyecto raíz configurado para tu organización (habitualmente uno)."
              href="/proyecto"
            />
            <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur-sm sm:col-span-2 xl:col-span-1">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Objetivos</CardTitle>
                <div
                  className="shrink-0 rounded-lg bg-primary/[0.08] p-2 text-primary ring-1 ring-primary/10 dark:bg-primary/15"
                  aria-hidden
                >
                  <Target className="size-4" />
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 pt-0 sm:grid-cols-2">
                <div>
                  <p className="text-2xl font-semibold tabular-nums tracking-tight">{nf(stats.institutionalObjectives)}</p>
                  <p className="text-xs text-muted-foreground">Institucionales</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums tracking-tight">{nf(stats.strategicObjectives)}</p>
                  <p className="text-xs text-muted-foreground">Estratégicos (OKR)</p>
                </div>
              </CardContent>
            </Card>
            <MetricCard
              icon={KeyRound}
              label="Resultados clave"
              value={nf(stats.keyResults)}
              description="Métricas (KR) bajo objetivos clave."
              href="/resultados-clave"
            />
            <div className="sm:col-span-2 xl:col-span-3">
              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur-sm lg:col-span-2">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Actividades abiertas</CardTitle>
                    <div
                      className="shrink-0 rounded-lg bg-primary/[0.08] p-2 text-primary ring-1 ring-primary/10 dark:bg-primary/15"
                      aria-hidden
                    >
                      <ListTodo className="size-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-6 pt-0 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-3xl font-semibold tabular-nums tracking-tight">{nf(openTotal)}</p>
                      <p className="text-xs text-muted-foreground">Pendientes + en progreso</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold tabular-nums text-foreground">{nf(stats.activitiesPlanned)}</p>
                      <p className="text-xs text-muted-foreground">Planificadas</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold tabular-nums text-foreground">{nf(stats.activitiesInProgress)}</p>
                      <p className="text-xs text-muted-foreground">En progreso</p>
                    </div>
                    <div>
                      <p
                        className={
                          stats.activitiesOverdue > 0
                            ? "text-2xl font-semibold tabular-nums text-destructive"
                            : "text-2xl font-semibold tabular-nums text-foreground"
                        }
                      >
                        {nf(stats.activitiesOverdue)}
                      </p>
                      <p className="text-xs text-muted-foreground">Vencidas (≠ Hecha)</p>
                      <Link
                        href="/actividades?vencidas=1"
                        className="mt-1 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Ver en listado
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur-sm lg:col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Accesos rápidos</CardTitle>
                    <CardDescription className="text-xs">Ciclo OKR en tu organización.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2 text-sm">
                    <Link
                      href="/proyecto"
                      className="rounded-full border border-border/80 bg-background px-3 py-1 text-muted-foreground transition-colors hover:border-primary/25 hover:text-foreground"
                    >
                      Proyecto
                    </Link>
                    <Link
                      href="/objetivos"
                      className="rounded-full border border-border/80 bg-background px-3 py-1 text-muted-foreground transition-colors hover:border-primary/25 hover:text-foreground"
                    >
                      Objetivos
                    </Link>
                    <Link
                      href="/actividades"
                      className="rounded-full border border-border/80 bg-background px-3 py-1 text-muted-foreground transition-colors hover:border-primary/25 hover:text-foreground"
                    >
                      Actividades
                    </Link>
                    <Link
                      href="/reportes"
                      className="rounded-full border border-border/80 bg-background px-3 py-1 text-muted-foreground transition-colors hover:border-primary/25 hover:text-foreground"
                    >
                      Reportes OKR
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2 lg:items-start" aria-labelledby="dash-charts-tenant">
          <CompanyDashboardCharts data={companyCharts} includeKeyResultsRanking={false} />
          <div className="flex min-w-0 flex-col gap-4">
            <DashboardKeyResultsRankingCard data={companyCharts} />
          </div>
        </section>
        <AreaPerformanceSection data={companyCharts} />
        <QuarterlyGanttSection data={companyCharts} />
      </div>
    );
  }

  const noCompanyOp = !stats.companyId;

  return (
    <div className="flex flex-col gap-8">
      {noCompanyOp ? (
        <Card className="border-amber-500/30 bg-amber-500/[0.06] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-950 dark:text-amber-100">Sin empresa asignada</CardTitle>
            <CardDescription className="text-amber-900/80 dark:text-amber-100/80">
              No podemos mostrar actividades sin contexto de organización. Pedí asignación a un administrador.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            Vista operativa · <span className="font-medium text-foreground">{companyName ?? "Tu empresa"}</span>
          </p>
          {stats.companyId && executive ? (
            <ExecutiveDashboardSection data={executive} companyName={companyName} />
          ) : null}
          <section aria-labelledby="dash-kpis-operator">
            <h2 id="dash-kpis-operator" className="sr-only">
              Tu trabajo y actividades
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                icon={ClipboardList}
                label="Actividades con tu seguimiento"
                value={nf(stats.activitiesWithYourProgress)}
                description="Distintas actividades donde registraste al menos un avance (no implica asignación exclusiva)."
                href="/actividades"
              />
              <MetricCard
                icon={ListTodo}
                label="Pendientes en la organización"
                value={nf(stats.activitiesPlanned)}
                description="Actividades planificadas aún no iniciadas en tu empresa."
                href="/actividades"
              />
              <MetricCard
                icon={Activity}
                label="En progreso"
                value={nf(stats.activitiesInProgress)}
                description="Actividades marcadas en curso dentro de tu empresa."
                href="/actividades"
              />
              <MetricCard
                icon={CalendarClock}
                label="Vencidas"
                value={
                  <span className={stats.activitiesOverdue > 0 ? "text-destructive" : undefined}>
                    {nf(stats.activitiesOverdue)}
                  </span>
                }
                description="Fecha de vencimiento anterior a hoy y no hechas."
                href="/actividades?vencidas=1"
              />
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2" aria-labelledby="dash-operator-detail">
            <div className="min-w-0">
              <OperatorRecentProgress items={stats.recentProgress} />
            </div>
            <CompanyDashboardCharts
              data={companyCharts}
              heading="Avance de la organización"
              description="Los mismos indicadores de seguimiento que ve el administrador, para contexto compartido de la organización."
            />
          </section>
          <AreaPerformanceSection data={companyCharts} />
          <QuarterlyGanttSection data={companyCharts} />
        </>
      )}
    </div>
  );
}
