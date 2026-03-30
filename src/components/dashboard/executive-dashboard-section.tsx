import type { ReactNode } from "react";
import Link from "next/link";
import { ActivityOverdueBadge } from "@/components/activities/activity-overdue-badge";
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  Flag,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { CompanyExecutiveDashboard } from "@/lib/dashboard/executive";
import { KeyResultProgressHealthBadge } from "@/components/key-results/key-result-progress-health-badge";
import { AnimatedProgressRing } from "@/components/ui/animated-progress-ring";
import { activityStatusLabel, formatDate, formatDateTime } from "@/lib/format";

function pctLabel(p: number | null | undefined): string {
  const n = p == null || Number.isNaN(Number(p)) ? 0 : Number(p);
  return `${n.toFixed(1)}%`;
}

function ListRow({
  href,
  title,
  subtitle,
  right,
  badge,
}: {
  href: string;
  title: string;
  subtitle?: string;
  right?: string;
  badge?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-lg border border-transparent px-2 py-2.5 transition-colors hover:border-border/80 hover:bg-muted/40"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">{title}</p>
        {subtitle ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {badge}
        {right ? <span className="text-xs tabular-nums text-muted-foreground">{right}</span> : null}
        <ChevronRight className="size-4 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  );
}

type ExecutiveDashboardSectionProps = {
  data: CompanyExecutiveDashboard;
  companyName: string | null;
};

export function ExecutiveDashboardSection({ data, companyName }: ExecutiveDashboardSectionProps) {
  const {
    portfolioProgressPercent,
    projects,
    lowestInstitutionalObjectives,
    keyResultsAtRisk,
    criticalLowestKeyResult,
    criticalLowestStrategicObjective,
    criticalActivities,
    activitiesOverdue,
    activitiesOverdueCount,
    activitiesBlocked,
    activitiesCompletedRecent,
    highlightTopKeyResults,
    highlightNearCompleteStrategicObjectives,
  } = data;

  return (
    <section
      className="mb-10 space-y-6"
      aria-labelledby="exec-dashboard-heading"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="exec-dashboard-heading" className="text-lg font-semibold tracking-tight text-foreground">
            Resumen ejecutivo
          </h2>
          <p className="text-sm text-muted-foreground">
            Progreso consolidado y foco operativo
            {companyName ? (
              <>
                {" "}
                · <span className="font-medium text-foreground">{companyName}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-primary/[0.06] via-card to-card shadow-md dark:from-primary/10">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <AnimatedProgressRing value={portfolioProgressPercent} />
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Progreso general
              </p>
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                {pctLabel(portfolioProgressPercent)}
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                Promedio del avance de tus proyectos institucionales (según datos ya calculados en cada proyecto).
              </p>
            </div>
          </div>
          {projects.length > 0 ? (
            <div className="flex min-w-0 flex-col gap-2 sm:max-w-sm">
              <p className="text-xs font-medium text-muted-foreground">Por proyecto</p>
              <div className="flex flex-wrap gap-2">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/proyecto/${p.id}`}
                    className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-lg border border-border/80 bg-background/80 px-2.5 text-xs font-normal shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/60"
                  >
                    <span className="max-w-[140px] truncate">{p.title}</span>
                    <span className="tabular-nums text-muted-foreground">{pctLabel(p.progressPercent)}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/80 shadow-md">
        <CardHeader className="border-b border-border/60 bg-muted/30 pb-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Crosshair className="size-5" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base">Puntos críticos</CardTitle>
                <CardDescription className="mt-1 max-w-2xl">
                  Foco en menor avance y actividades con mayor impacto operativo (vencidas primero, luego
                  bloqueadas).
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid divide-y divide-border/70 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            <div className="flex flex-col p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Target className="size-3.5 text-rose-600 dark:text-rose-400" aria-hidden />
                Resultado clave con menor avance
              </div>
              {criticalLowestKeyResult ? (
                <Link
                  href={`/resultados-clave/${criticalLowestKeyResult.id}`}
                  className="group flex flex-1 flex-col rounded-xl border border-border/80 bg-card p-4 shadow-sm transition-colors hover:border-primary/35 hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                      {criticalLowestKeyResult.title}
                    </p>
                    <span className="shrink-0 rounded-md bg-rose-500/15 px-2 py-0.5 text-xs font-bold tabular-nums text-rose-900 dark:text-rose-100">
                      {pctLabel(criticalLowestKeyResult.progressPercent)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    OC: {criticalLowestKeyResult.strategicObjectiveTitle}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    OI: {criticalLowestKeyResult.institutionalObjectiveTitle} ·{" "}
                    {criticalLowestKeyResult.projectTitle}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Abrir resultado clave
                    <ChevronRight className="size-3.5 opacity-70 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ) : (
                <p className="flex flex-1 items-center rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                  No hay resultados clave con avance calculado.
                </p>
              )}
            </div>

            <div className="flex flex-col p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Flag className="size-3.5 text-amber-600 dark:text-amber-400" aria-hidden />
                Objetivo clave más atrasado
              </div>
              {criticalLowestStrategicObjective ? (
                <Link
                  href={`/objetivos-clave/${criticalLowestStrategicObjective.id}`}
                  className="group flex flex-1 flex-col rounded-xl border border-border/80 bg-card p-4 shadow-sm transition-colors hover:border-primary/35 hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                      {criticalLowestStrategicObjective.title}
                    </p>
                    <span className="shrink-0 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold tabular-nums text-amber-950 dark:text-amber-100">
                      {pctLabel(criticalLowestStrategicObjective.progressPercent)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    OI: {criticalLowestStrategicObjective.institutionalObjectiveTitle}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Proyecto: {criticalLowestStrategicObjective.projectTitle}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Abrir objetivo clave
                    <ChevronRight className="size-3.5 opacity-70 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ) : (
                <p className="flex flex-1 items-center rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                  No hay objetivos clave con avance calculado.
                </p>
              )}
            </div>

            <div className="flex flex-col p-5 lg:col-span-1">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <AlertTriangle className="size-3.5 text-rose-600 dark:text-rose-400" aria-hidden />
                Actividades vencidas o bloqueadas
              </div>
              {criticalActivities.length > 0 ? (
                <ScrollArea className="h-[min(260px,42vh)] pr-2">
                  <ul className="space-y-2">
                    {criticalActivities.map((a) => (
                      <li key={`${a.kind}-${a.id}`}>
                        <Link
                          href={`/actividades/${a.id}`}
                          className={
                            a.kind === "overdue"
                              ? "block rounded-lg border border-rose-500/30 bg-rose-500/[0.06] px-3 py-2.5 text-sm transition-colors hover:border-rose-500/45 hover:bg-rose-500/[0.1] dark:bg-rose-500/[0.08]"
                              : "block rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2.5 text-sm transition-colors hover:border-amber-500/40 hover:bg-amber-500/[0.1]"
                          }
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="min-w-0 flex-1 font-medium leading-snug text-foreground">{a.title}</p>
                            {a.kind === "overdue" ? (
                              <Badge
                                variant="outline"
                                className="shrink-0 border-rose-500/40 bg-rose-500/10 text-[10px] font-semibold text-rose-900 dark:text-rose-100"
                              >
                                Vencida
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="shrink-0 border-amber-500/40 bg-amber-500/10 text-[10px] font-semibold text-amber-950 dark:text-amber-100"
                              >
                                Bloqueada
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{a.keyResultTitle}</p>
                          {a.kind === "overdue" && a.dueDate ? (
                            <p className="mt-1 text-[11px] font-medium text-rose-800 dark:text-rose-200">
                              Vence {formatDate(a.dueDate)}
                            </p>
                          ) : null}
                          {a.kind === "blocked" && a.updatedAt ? (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Actualizado {formatDateTime(a.updatedAt)}
                            </p>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <p className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                  No hay actividades vencidas ni bloqueadas en este momento.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-emerald-500/30 shadow-md dark:border-emerald-500/25">
        <CardHeader className="border-b border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.09] via-emerald-500/[0.04] to-transparent pb-4 dark:from-emerald-500/15 dark:via-emerald-500/8">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              <Sparkles className="size-5" aria-hidden />
            </div>
            <div>
              <CardTitle className="text-base text-emerald-950 dark:text-emerald-50">Avances destacados</CardTitle>
              <CardDescription className="mt-1 max-w-2xl text-emerald-900/80 dark:text-emerald-100/75">
                Logros y momentum: mayor avance en KRs, objetivos clave cerca de cerrar y cierres recientes de
                actividades.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid divide-y divide-emerald-500/15 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            <div className="flex flex-col p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-800/90 dark:text-emerald-200/90">
                <TrendingUp className="size-3.5" aria-hidden />
                Resultados clave con mayor avance
              </div>
              {highlightTopKeyResults.length > 0 ? (
                <ScrollArea className="h-[min(260px,42vh)] pr-2">
                  <ul className="space-y-1.5">
                    {highlightTopKeyResults.map((k) => (
                      <li key={k.id}>
                        <Link
                          href={`/resultados-clave/${k.id}`}
                          className="group flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2.5 transition-colors hover:border-emerald-500/45 hover:bg-emerald-500/[0.1] dark:bg-emerald-500/[0.08]"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-snug text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                              {k.title}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{k.strategicObjectiveTitle}</p>
                          </div>
                          <span className="shrink-0 rounded-md bg-emerald-600/15 px-2 py-0.5 text-xs font-bold tabular-nums text-emerald-900 dark:text-emerald-100">
                            {pctLabel(k.progressPercent)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <p className="rounded-lg border border-dashed border-emerald-500/30 bg-emerald-500/[0.04] px-4 py-8 text-center text-sm text-muted-foreground">
                  No hay resultados clave con avance calculado.
                </p>
              )}
              <Link
                href="/resultados-clave"
                className="mt-3 inline-flex text-sm font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
              >
                Ver todos los resultados clave
              </Link>
            </div>

            <div className="flex flex-col p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-800/90 dark:text-emerald-200/90">
                <Flag className="size-3.5" aria-hidden />
                Objetivos clave cerca de completarse
              </div>
              {highlightNearCompleteStrategicObjectives.length > 0 ? (
                <ScrollArea className="h-[min(260px,42vh)] pr-2">
                  <ul className="space-y-1.5">
                    {highlightNearCompleteStrategicObjectives.map((o) => (
                      <li key={o.id}>
                        <Link
                          href={`/objetivos-clave/${o.id}`}
                          className="group flex flex-col rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2.5 transition-colors hover:border-emerald-500/45 hover:bg-emerald-500/[0.1] dark:bg-emerald-500/[0.08]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                              {o.title}
                            </p>
                            <span className="shrink-0 rounded-md bg-emerald-600/15 px-2 py-0.5 text-xs font-bold tabular-nums text-emerald-900 dark:text-emerald-100">
                              {pctLabel(o.progressPercent)}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {o.institutionalObjectiveTitle} · {o.projectTitle}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <p className="rounded-lg border border-dashed border-emerald-500/30 bg-emerald-500/[0.04] px-4 py-8 text-center text-sm text-muted-foreground">
                  Ningún objetivo clave entre 80 % y 100 % de avance por ahora.
                </p>
              )}
              <Link
                href="/objetivos-clave"
                className="mt-3 inline-flex text-sm font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
              >
                Ver todos los objetivos clave
              </Link>
            </div>

            <div className="flex flex-col p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-800/90 dark:text-emerald-200/90">
                <CheckCircle2 className="size-3.5" aria-hidden />
                Actividades completadas recientemente
              </div>
              {activitiesCompletedRecent.length > 0 ? (
                <ScrollArea className="h-[min(260px,42vh)] pr-2">
                  <ul className="space-y-2">
                    {activitiesCompletedRecent.map((a) => (
                      <li key={a.id}>
                        <Link
                          href={`/actividades/${a.id}`}
                          className="block rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-2.5 text-sm transition-colors hover:border-emerald-500/45 hover:bg-emerald-500/[0.12] dark:bg-emerald-500/[0.1]"
                        >
                          <p className="font-medium leading-snug text-foreground">{a.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{a.keyResultTitle}</p>
                          {a.updatedAt ? (
                            <p className="mt-1 text-[11px] font-medium text-emerald-800/90 dark:text-emerald-200/90">
                              Completada {formatDateTime(a.updatedAt)}
                            </p>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <p className="rounded-lg border border-dashed border-emerald-500/30 bg-emerald-500/[0.04] px-4 py-8 text-center text-sm text-muted-foreground">
                  Aún no hay actividades marcadas como hechas recientemente.
                </p>
              )}
              <Link
                href="/actividades"
                className="mt-3 inline-flex text-sm font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
              >
                Ir a actividades
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300">
                <TrendingDown className="size-4" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base">Objetivos institucionales con menor avance</CardTitle>
                <CardDescription>Ordenados por % consolidado (menor primero).</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {lowestInstitutionalObjectives.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No hay objetivos con avance calculado aún.
              </p>
            ) : (
              <ScrollArea className="h-[min(280px,50vh)] pr-3">
                <div className="space-y-0 divide-y divide-border/60">
                  {lowestInstitutionalObjectives.map((o) => (
                    <ListRow
                      key={o.id}
                      href={`/objetivos/${o.id}`}
                      title={o.title}
                      subtitle={`${o.projectTitle}`}
                      right={pctLabel(o.progressPercent)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
            <Separator className="mt-4" />
            <Link
              href="/objetivos"
              className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
            >
              Ver todos los objetivos institucionales
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300">
                <AlertTriangle className="size-4" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base">Resultados clave en riesgo</CardTitle>
                <CardDescription>
                  KRs con estado &quot;En riesgo&quot; en el registro. El semáforo refleja el % de avance
                  consolidado.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {keyResultsAtRisk.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No hay KRs marcados en riesgo.
              </p>
            ) : (
              <ScrollArea className="h-[min(280px,50vh)] pr-3">
                <div className="space-y-0 divide-y divide-border/60">
                  {keyResultsAtRisk.map((k) => (
                    <ListRow
                      key={k.id}
                      href={`/resultados-clave/${k.id}`}
                      title={k.title}
                      subtitle={k.strategicObjectiveTitle}
                      right={pctLabel(k.progressPercent)}
                      badge={<KeyResultProgressHealthBadge progressPercent={k.progressPercent} size="compact" />}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
            <Separator className="mt-4" />
            <Link
              href="/resultados-clave"
              className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
            >
              Ver todos los resultados clave
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card
          className={
            activitiesOverdueCount > 0
              ? "border-rose-500/35 bg-rose-500/[0.04] shadow-sm dark:bg-rose-500/[0.07]"
              : "border-border/80 shadow-sm"
          }
        >
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 text-rose-600 dark:text-rose-400" aria-hidden />
                <CardTitle className="text-base">Actividades vencidas</CardTitle>
              </div>
              {activitiesOverdueCount > 0 ? (
                <span className="rounded-full bg-rose-600/15 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-rose-900 dark:text-rose-100">
                  {activitiesOverdueCount.toLocaleString("es")}
                </span>
              ) : null}
            </div>
            <CardDescription>
              Vencimiento anterior a hoy y estado distinto de Hecha. Total en la empresa:{" "}
              <span className="font-medium text-foreground">{activitiesOverdueCount.toLocaleString("es")}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {activitiesOverdue.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Ninguna actividad vencida pendiente.</p>
            ) : (
              <ScrollArea className="h-[min(220px,40vh)] pr-3">
                <ul className="space-y-2">
                  {activitiesOverdue.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/actividades/${a.id}`}
                        className="block rounded-lg border border-rose-500/25 bg-rose-500/[0.06] px-3 py-2 text-sm transition-colors hover:border-rose-500/40 hover:bg-rose-500/[0.1] dark:bg-rose-500/[0.08]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="min-w-0 flex-1 font-medium leading-snug text-foreground">{a.title}</p>
                          <ActivityOverdueBadge size="compact" />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{a.keyResultTitle}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-medium text-rose-800 dark:text-rose-200">
                            Vence {a.dueDate ? formatDate(a.dueDate) : "—"}
                          </span>
                          {a.status ? (
                            <Badge variant="secondary" className="text-[10px] font-normal">
                              {activityStatusLabel(a.status)}
                            </Badge>
                          ) : null}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
            {activitiesOverdueCount > 0 ? (
              <Link
                href="/actividades?vencidas=1"
                className="mt-3 inline-flex text-sm font-medium text-rose-700 underline-offset-4 hover:underline dark:text-rose-300"
              >
                {activitiesOverdueCount > activitiesOverdue.length
                  ? `Ver las ${activitiesOverdueCount.toLocaleString("es")} vencidas en el listado`
                  : "Abrir listado con filtro solo vencidas"}
              </Link>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Ban className="size-4 text-amber-700 dark:text-amber-300" aria-hidden />
              <CardTitle className="text-base">Actividades bloqueadas</CardTitle>
            </div>
            <CardDescription>Estado bloqueado; requiere atención.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {activitiesBlocked.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No hay actividades bloqueadas.</p>
            ) : (
              <ScrollArea className="h-[min(220px,40vh)] pr-3">
                <ul className="space-y-2">
                  {activitiesBlocked.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/actividades/${a.id}`}
                        className="block rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm transition-colors hover:border-border hover:bg-muted/40"
                      >
                        <p className="font-medium leading-snug text-foreground">{a.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{a.keyResultTitle}</p>
                        {a.updatedAt ? (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Actualizado {formatDateTime(a.updatedAt)}
                          </p>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
