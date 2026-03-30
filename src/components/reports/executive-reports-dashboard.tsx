import type { LucideIcon } from "lucide-react";
import { Activity, Crosshair, Gauge, Landmark, Target, Users } from "lucide-react";
import Link from "next/link";
import { ExecutiveReportsCharts } from "@/components/reports/executive-reports-charts";
import { KeyResultProgressHealthBadge } from "@/components/key-results/key-result-progress-health-badge";
import { ReportProgressBar } from "@/components/reports/report-progress-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SessionUser } from "@/lib/auth/session-user";
import {
  activityStatusLabel,
  institutionalObjectiveStatusLabel,
  institutionalProjectStatusLabel,
  keyResultStatusLabel,
  strategicObjectiveStatusLabel,
} from "@/lib/format";
import type { ExecutiveReportPayload } from "@/lib/reports/types";
import { cn } from "@/lib/utils";

function nf(n: number): string {
  return n.toLocaleString("es");
}

function pct(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(1)}%`;
}

type ExecutiveReportsDashboardProps = {
  session: SessionUser;
  data: ExecutiveReportPayload;
};

export function ExecutiveReportsDashboard({ session, data }: ExecutiveReportsDashboardProps) {
  const { summary, filters } = data;
  const showConsolidatedSuper = session.role === "SUPER_ADMIN" && !filters.companyId;

  if (data.emptyReason) {
    return (
      <Card className="border-dashed border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-base text-amber-950 dark:text-amber-100">Sin datos en este alcance</CardTitle>
          <CardDescription className="text-amber-900/80 dark:text-amber-200/90">{data.emptyReason}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {showConsolidatedSuper ? (
        <p className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-sm text-sky-950 dark:text-sky-100">
          Vista <span className="font-medium">consolidada</span>: incluye todas las empresas. Restringí por empresa
          para tablas más legibles.
        </p>
      ) : null}

      <section aria-labelledby="exec-summary-heading">
        <h2 id="exec-summary-heading" className="sr-only">
          Resumen ejecutivo
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proyectos</CardTitle>
              <Landmark className="size-4 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{nf(summary.projectsCount)}</p>
              <p className="text-xs text-muted-foreground">Institucionales en alcance</p>
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cadena OKR</CardTitle>
              <Target className="size-4 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-sm tabular-nums text-foreground">
                OI {nf(summary.institutionalObjectivesCount)} · OC {nf(summary.strategicObjectivesCount)} · KR{" "}
                {nf(summary.keyResultsCount)}
              </p>
              <p className="text-xs text-muted-foreground">Objetivos institucionales, clave y resultados</p>
            </CardContent>
          </Card>
          <Card
            className={cn(
              "shadow-sm",
              summary.activitiesOverdueInScope > 0
                ? "border-rose-500/35 bg-rose-500/[0.04] dark:bg-rose-500/[0.07]"
                : "border-border/80"
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actividades (filtro)</CardTitle>
              <Activity
                className={cn(
                  "size-4",
                  summary.activitiesOverdueInScope > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
                )}
                aria-hidden
              />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{nf(summary.activitiesInScope)}</p>
              <p className="text-xs text-muted-foreground">
                Hechas: {nf(summary.activitiesDoneInScope)}
                {filters.dateFrom || filters.dateTo ? " · por fecha de creación" : ""}
              </p>
              <p
                className={
                  summary.activitiesOverdueInScope > 0
                    ? "mt-2 text-sm font-semibold text-destructive"
                    : "mt-2 text-sm text-muted-foreground"
                }
              >
                Vencidas: {nf(summary.activitiesOverdueInScope)}
                <span className="ml-1 font-normal text-muted-foreground">
                  (vence &lt; hoy · ≠ Hecha · mismo alcance)
                </span>
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avance medio</CardTitle>
              <Gauge className="size-4 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold tabular-nums">
                KR {pct(summary.avgKeyResultProgress)} · OI {pct(summary.avgInstitutionalObjectiveProgress)}
              </p>
              <p className="text-xs text-muted-foreground">Promedio simple con dato de progreso</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="exec-charts-heading">
        <h2 id="exec-charts-heading" className="sr-only">
          Gráficos del reporte ejecutivo
        </h2>
        <ExecutiveReportsCharts data={data} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Actividades por estado</CardTitle>
            <CardDescription>Misma ventana de filtros (fechas = creación de la actividad).</CardDescription>
          </CardHeader>
          <CardContent>
            {data.activitiesByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin actividades en este criterio.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.activitiesByStatus.map((row) => (
                    <TableRow key={row.status}>
                      <TableCell className="font-medium">{activityStatusLabel(row.status)}</TableCell>
                      <TableCell className="text-right tabular-nums">{nf(row.count)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-primary" aria-hidden />
              Responsables con más actividades
            </CardTitle>
            <CardDescription>Top 15 por volumen en el mismo alcance y filtros.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topAssignees.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin asignaciones con responsable en este criterio.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="text-right">Actividades</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topAssignees.map((row, i) => (
                    <TableRow key={row.userId}>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{row.name}</span>
                          <span className="text-xs text-muted-foreground">{row.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="tabular-nums font-normal">
                          #{i + 1} · {nf(row.count)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ReportTableSection
        title="Avance por proyecto institucional"
        description="Promedio ponderado por peso de los objetivos institucionales bajo cada proyecto."
        icon={Landmark}
      >
        <Table>
          <TableHeader>
            <TableRow>
              {session.role === "SUPER_ADMIN" ? <TableHead>Empresa</TableHead> : null}
              <TableHead>Proyecto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Obj. inst.</TableHead>
              <TableHead>Avance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.projectProgress.map((row) => (
              <TableRow key={row.id}>
                {session.role === "SUPER_ADMIN" ? (
                  <TableCell className="max-w-[140px] truncate text-muted-foreground">{row.companyName}</TableCell>
                ) : null}
                <TableCell className="max-w-[220px]">
                  <ButtonLink href={`/proyecto/${row.id}`} label={row.title} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {institutionalProjectStatusLabel(row.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{nf(row.objectivesCount)}</TableCell>
                <TableCell>
                  <ReportProgressBar value={row.avgProgress} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ReportTableSection>

      <ReportTableSection
        title="Avance por objetivo institucional"
        description="Progreso consolidado almacenado en cada OI."
        icon={Target}
      >
        <Table>
          <TableHeader>
            <TableRow>
              {session.role === "SUPER_ADMIN" ? <TableHead>Empresa</TableHead> : null}
              <TableHead>Objetivo</TableHead>
              <TableHead>Proyecto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Avance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.ioProgress.map((row) => (
              <TableRow key={row.id}>
                {session.role === "SUPER_ADMIN" ? (
                  <TableCell className="max-w-[120px] truncate text-muted-foreground">{row.companyName}</TableCell>
                ) : null}
                <TableCell className="max-w-[200px]">
                  <ButtonLink href={`/objetivos/${row.id}`} label={row.title} />
                </TableCell>
                <TableCell className="max-w-[160px] truncate text-muted-foreground">{row.projectTitle}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {institutionalObjectiveStatusLabel(row.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ReportProgressBar value={row.progress} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ReportTableSection>

      <ReportTableSection
        title="Avance por objetivo clave"
        description="Progreso consolidado de cada objetivo clave (OKR)."
        icon={Crosshair}
      >
        <Table>
          <TableHeader>
            <TableRow>
              {session.role === "SUPER_ADMIN" ? <TableHead>Empresa</TableHead> : null}
              <TableHead>Objetivo clave</TableHead>
              <TableHead>OI / Proyecto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Avance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.soProgress.map((row) => (
              <TableRow key={row.id}>
                {session.role === "SUPER_ADMIN" ? (
                  <TableCell className="max-w-[120px] truncate text-muted-foreground">{row.companyName}</TableCell>
                ) : null}
                <TableCell className="max-w-[200px]">
                  <ButtonLink href={`/objetivos-clave/${row.id}`} label={row.title} />
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <span className="line-clamp-2 text-muted-foreground text-xs">{row.ioTitle}</span>
                  <span className="block text-[0.7rem] text-muted-foreground/80">{row.projectTitle}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {strategicObjectiveStatusLabel(row.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ReportProgressBar value={row.progress} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ReportTableSection>

      <ReportTableSection
        title="Avance por resultado clave"
        description="Indicadores bajo objetivos clave; orden por última actualización. El semáforo coloreado refleja el % de avance (no sustituye el estado operativo del KR)."
        icon={Gauge}
      >
        {summary.keyResultsCount > data.keyResultsShown ? (
          <p className="mb-3 text-xs text-muted-foreground">
            Mostrando los {nf(data.keyResultsShown)} más recientes por actualización; total en alcance:{" "}
            {nf(summary.keyResultsCount)}.
          </p>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow>
              {session.role === "SUPER_ADMIN" ? <TableHead>Empresa</TableHead> : null}
              <TableHead>Resultado clave</TableHead>
              <TableHead>Contexto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Avance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.krProgress.map((row) => (
              <TableRow key={row.id}>
                {session.role === "SUPER_ADMIN" ? (
                  <TableCell className="max-w-[120px] truncate text-muted-foreground">{row.companyName}</TableCell>
                ) : null}
                <TableCell className="max-w-[200px]">
                  <ButtonLink href={`/resultados-clave/${row.id}`} label={row.title} />
                </TableCell>
                <TableCell className="max-w-[220px] text-xs text-muted-foreground">
                  <span className="line-clamp-2">{row.soTitle}</span>
                  <span className="block opacity-80">{row.projectTitle}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-start gap-1.5">
                    <Badge variant="outline" className="font-normal">
                      {keyResultStatusLabel(row.status)}
                    </Badge>
                    <KeyResultProgressHealthBadge progressPercent={row.progress} size="compact" />
                  </div>
                </TableCell>
                <TableCell>
                  <ReportProgressBar value={row.progress} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ReportTableSection>
    </div>
  );
}

function ButtonLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "font-medium text-primary underline-offset-4 hover:underline",
        "line-clamp-2 text-left"
      )}
    >
      {label}
    </Link>
  );
}

function ReportTableSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-primary" aria-hidden />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">{children}</CardContent>
    </Card>
  );
}
