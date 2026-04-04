import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Crosshair, KeyRound, ListTodo, Pencil, Target } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { KeyResultProgressHealthBadge } from "@/components/key-results/key-result-progress-health-badge";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireSessionUser } from "@/lib/auth/session-user";
import {
  activityStatusLabel,
  formatDate,
  institutionalObjectiveStatusLabel,
  institutionalProjectStatusLabel,
  keyResultStatusLabel,
  strategicObjectiveStatusLabel,
} from "@/lib/format";
import { computeProjectProgressFromInstitutionalObjectives } from "@/lib/okr/strategic-progress-engine";
import { prisma } from "@/lib/prisma";
import {
  canMutateInstitutionalProject,
  canMutateInstitutionalProjects,
  canViewInstitutionalProject,
} from "@/lib/institutional-projects/policy";

type PageProps = { params: Promise<{ id: string }> };

function formatProgress(p: number | null): string {
  if (p == null || Number.isNaN(p)) return "Sin datos";
  return `${p.toFixed(1)}%`;
}

function formatWeight(w: unknown): string {
  const n = Number(w);
  if (!Number.isFinite(n)) return "—";
  return n.toString();
}

function ProgressInline({
  value,
  className = "",
}: {
  value: number | null;
  className?: string;
}) {
  const pct = value != null && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : null;
  return (
    <div className={`min-w-[140px] ${className}`}>
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="text-muted-foreground">Progreso</span>
        <span className="tabular-nums font-medium text-foreground">{formatProgress(value)}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted/80">
        {pct != null ? (
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
            style={{ width: `${pct}%` }}
          />
        ) : (
          <div className="h-full w-0" />
        )}
      </div>
    </div>
  );
}

export default async function ProyectoInstitucionalDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSessionUser();

  const project = await prisma.institutionalProject.findUnique({
    where: { id },
    include: {
      company: { select: { name: true, id: true } },
      _count: { select: { objectives: true } },
    },
  });

  if (!project) notFound();

  if (!canViewInstitutionalProject(session, project.companyId)) {
    redirect("/proyecto");
  }

  const canEdit =
    canMutateInstitutionalProjects(session) && canMutateInstitutionalProject(session, project.companyId);

  const [strategicObjectivesCount, keyResultsCount, activitiesCount, hierarchy] = await Promise.all([
    prisma.strategicObjective.count({
      where: { institutionalObjective: { institutionalProjectId: project.id } },
    }),
    prisma.keyResult.count({
      where: { strategicObjective: { institutionalObjective: { institutionalProjectId: project.id } } },
    }),
    prisma.activity.count({
      where: { keyResult: { strategicObjective: { institutionalObjective: { institutionalProjectId: project.id } } } },
    }),
    prisma.institutionalObjective.findMany({
      where: { institutionalProjectId: project.id },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        status: true,
        progressCached: true,
        weight: true,
        includedInGeneralProgress: true,
        strategicObjectives: {
          orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
          select: {
            id: true,
            title: true,
            status: true,
            progressCached: true,
            weight: true,
            keyResults: {
              orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
              select: {
                id: true,
                title: true,
                status: true,
                progressCached: true,
                weight: true,
                activities: {
                  orderBy: [{ createdAt: "desc" }],
                  select: {
                    id: true,
                    title: true,
                    status: true,
                    progressContribution: true,
                    contributionWeight: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const institutionalObjectivesCount = project._count.objectives;
  const generalProgressComputed = computeProjectProgressFromInstitutionalObjectives(
    hierarchy
      .filter((io) => io.includedInGeneralProgress)
      .map((io) => ({
        weight: Number(io.weight),
        progress: io.progressCached != null ? Number(io.progressCached) : null,
      }))
  );
  const generalProgress =
    project.progressCached != null && !Number.isNaN(Number(project.progressCached))
      ? Number(project.progressCached)
      : generalProgressComputed;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <Button variant="ghost" size="sm" className="gap-1 px-0 text-muted-foreground" render={<Link href="/proyecto" />}>
            <ArrowLeft className="size-4" />
            Volver al listado
          </Button>
          <PageHeading
            title={project.title}
            description={`${project.company.name}${project.year ? ` · Año ${project.year}` : ""}`}
          />
          <div className="flex flex-wrap gap-2">
            {project.status === "ACTIVE" ? (
              <Badge className="border-emerald-500/20 bg-emerald-500/10 font-normal text-emerald-800 dark:text-emerald-200">
                {institutionalProjectStatusLabel(project.status)}
              </Badge>
            ) : (
              <Badge variant="secondary" className="font-normal">
                {institutionalProjectStatusLabel(project.status)}
              </Badge>
            )}
            {project.methodology ? (
              <Badge variant="outline" className="font-normal">
                {project.methodology}
              </Badge>
            ) : null}
            <Badge variant="outline" className="font-normal tabular-nums">
              {project._count.objectives} objetivos institucionales
            </Badge>
          </div>
          <div className="max-w-md border-t border-border/60 pt-3">
            <p className="text-xs font-medium text-foreground">Progreso general del proyecto</p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              Promedio ponderado por peso, solo entre objetivos institucionales marcados para incluir en el avance
              general.
            </p>
            <ProgressInline value={generalProgress} className="mt-2" />
          </div>
        </div>
        {canEdit ? (
          <Button className="shrink-0 gap-1.5" render={<Link href={`/proyecto/${project.id}/edit`} />}>
            <Pencil className="size-4" />
            Editar
          </Button>
        ) : null}
      </div>

      <section className="mb-6 space-y-4" aria-labelledby="project-exec-summary">
        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle id="project-exec-summary" className="text-base">
              Resumen ejecutivo
            </CardTitle>
            <CardDescription>Vista rápida del estado general del proyecto institucional.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 lg:col-span-2">
              <p className="text-xs text-muted-foreground">Nombre</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{project.title}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Estado</p>
              <div className="mt-1">
                {project.status === "ACTIVE" ? (
                  <Badge className="border-emerald-500/20 bg-emerald-500/10 font-normal text-emerald-800 dark:text-emerald-200">
                    {institutionalProjectStatusLabel(project.status)}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="font-normal">
                    {institutionalProjectStatusLabel(project.status)}
                  </Badge>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Progreso general</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                Solo objetivos institucionales que suman al avance general (excluye los de solo seguimiento).
              </p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{formatProgress(generalProgress)}</p>
              <ProgressInline value={generalProgress} className="mt-1 min-w-0" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Target}
            label="Objetivos institucionales"
            value={institutionalObjectivesCount}
            description="Total bajo este proyecto."
          />
          <MetricCard
            icon={Crosshair}
            label="Objetivos clave"
            value={strategicObjectivesCount}
            description="Estrategias vinculadas."
          />
          <MetricCard
            icon={KeyRound}
            label="Resultados clave"
            value={keyResultsCount}
            description="KRs definidos en el alcance."
          />
          <MetricCard
            icon={ListTodo}
            label="Actividades"
            value={activitiesCount}
            description="Tareas operativas asociadas."
          />
        </div>
      </section>

      <section className="mb-6" aria-labelledby="project-hierarchy">
        <Card className="border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle id="project-hierarchy" className="text-base">
              Jerarquía ejecutiva
            </CardTitle>
            <CardDescription>
              Vista de solo lectura expandible: Objetivos institucionales, objetivos clave, resultados clave y actividades.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {hierarchy.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay objetivos institucionales cargados para este proyecto.</p>
            ) : (
              hierarchy.map((io) => (
                <details key={io.id} className="group rounded-xl border border-border/70 bg-muted/15 open:bg-muted/25">
                  <summary className="cursor-pointer list-none p-3">
                    <div className="grid gap-2 sm:grid-cols-[minmax(240px,1fr)_auto_auto_auto] sm:items-center">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{io.title}</p>
                        {!io.includedInGeneralProgress ? (
                          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                            No impacta en el avance general
                          </p>
                        ) : null}
                      </div>
                      <Badge variant="outline" className="w-fit font-normal">
                        {institutionalObjectiveStatusLabel(io.status)}
                      </Badge>
                      <ProgressInline value={io.progressCached != null ? Number(io.progressCached) : null} />
                      <span className="text-xs tabular-nums text-muted-foreground">Peso {formatWeight(io.weight)}</span>
                    </div>
                  </summary>

                  <div className="space-y-2 border-t border-border/60 p-3 pt-2">
                    {io.strategicObjectives.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sin objetivos clave.</p>
                    ) : (
                      io.strategicObjectives.map((so) => (
                        <details key={so.id} className="rounded-lg border border-border/60 bg-background/65">
                          <summary className="cursor-pointer list-none p-2.5">
                            <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_auto_auto_auto] sm:items-center">
                              <p className="min-w-0 truncate text-sm font-medium text-foreground">{so.title}</p>
                              <Badge variant="outline" className="w-fit font-normal">
                                {strategicObjectiveStatusLabel(so.status)}
                              </Badge>
                              <ProgressInline value={so.progressCached != null ? Number(so.progressCached) : null} />
                              <span className="text-xs tabular-nums text-muted-foreground">Peso {formatWeight(so.weight)}</span>
                            </div>
                          </summary>

                          <div className="space-y-2 border-t border-border/50 p-2.5 pt-2">
                            {so.keyResults.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Sin resultados clave.</p>
                            ) : (
                              so.keyResults.map((kr) => (
                                <details key={kr.id} className="rounded-md border border-border/50 bg-muted/10">
                                  <summary className="cursor-pointer list-none p-2">
                                    <div className="grid gap-2 sm:grid-cols-[minmax(200px,1fr)_auto_auto_auto] sm:items-center">
                                      <p className="min-w-0 truncate text-sm text-foreground">{kr.title}</p>
                                      <div className="flex flex-col items-start gap-1 sm:items-end">
                                        <Badge variant="outline" className="w-fit font-normal">
                                          {keyResultStatusLabel(kr.status)}
                                        </Badge>
                                        <KeyResultProgressHealthBadge
                                          progressPercent={
                                            kr.progressCached != null ? Number(kr.progressCached) : null
                                          }
                                          size="compact"
                                        />
                                      </div>
                                      <ProgressInline value={kr.progressCached != null ? Number(kr.progressCached) : null} />
                                      <span className="text-xs tabular-nums text-muted-foreground">
                                        Peso {formatWeight(kr.weight)}
                                      </span>
                                    </div>
                                  </summary>

                                  <div className="space-y-1.5 border-t border-border/50 p-2 pt-1.5">
                                    {kr.activities.length === 0 ? (
                                      <p className="text-xs text-muted-foreground">Sin actividades.</p>
                                    ) : (
                                      kr.activities.map((act) => (
                                        <div
                                          key={act.id}
                                          className="grid gap-1 sm:grid-cols-[minmax(180px,1fr)_auto_auto_auto] sm:items-center rounded-md bg-background/70 px-2 py-1.5"
                                        >
                                          <p className="min-w-0 truncate text-xs text-foreground">{act.title}</p>
                                          <Badge variant="outline" className="w-fit text-[11px] font-normal">
                                            {activityStatusLabel(act.status)}
                                          </Badge>
                                          <ProgressInline
                                            value={act.progressContribution != null ? Number(act.progressContribution) : null}
                                            className="min-w-[120px]"
                                          />
                                          <span className="text-[11px] tabular-nums text-muted-foreground">
                                            Peso {formatWeight(act.contributionWeight)}
                                          </span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </details>
                              ))
                            )}
                          </div>
                        </details>
                      ))
                    )}
                  </div>
                </details>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Resumen</CardTitle>
            <CardDescription>Alta {formatDate(project.createdAt)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {session.role === "SUPER_ADMIN" ? (
              <>
                <div>
                  <p className="text-muted-foreground">Empresa</p>
                  <p className="font-medium">{project.company.name}</p>
                </div>
                <Separator />
              </>
            ) : null}
            <div>
              <p className="text-muted-foreground">Descripción</p>
              <p className="whitespace-pre-wrap text-foreground">{project.description ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Misión y visión</CardTitle>
            <CardDescription>Contexto estratégico del proyecto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Misión</p>
              <p className="whitespace-pre-wrap text-foreground">{project.mission ?? "—"}</p>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground">Visión</p>
              <p className="whitespace-pre-wrap text-foreground">{project.vision ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
