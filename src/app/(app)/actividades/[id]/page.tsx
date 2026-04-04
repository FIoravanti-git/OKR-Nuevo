import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActivityProgressPanel } from "@/components/activities/activity-progress-panel";
import { ActivityProgressHistoryTimeline } from "@/components/progress-history/progress-history-timelines";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ActivityStatus } from "@/generated/prisma";
import { requireSessionUser } from "@/lib/auth/session-user";
import {
  canMutateActivities,
  canMutateActivity,
  canUpdateActivityProgress,
  canViewActivity,
} from "@/lib/activities/policy";
import { ActivityOverdueBadge } from "@/components/activities/activity-overdue-badge";
import {
  isBlockedByPredecessor,
  isDelayedStartVsPlanned,
  plannedStartPassedWhileBlocked,
} from "@/lib/activities/dependency";
import { isActivityOverdue } from "@/lib/activities/overdue";
import { activityStatusLabel, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

function formatProgress(p: number | null): string {
  if (p == null || Number.isNaN(p)) return "Sin dato";
  return `${Number(p).toFixed(1)}%`;
}

export default async function ActividadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSessionUser();

  const row = await prisma.activity.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      company: { select: { name: true } },
      dependsOnActivity: { select: { id: true, title: true, status: true } },
      keyResult: {
        select: {
          id: true,
          title: true,
          strategicObjective: {
            select: {
              id: true,
              title: true,
              institutionalObjective: {
                select: {
                  id: true,
                  title: true,
                  institutionalProject: { select: { id: true, title: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!row) notFound();

  if (!canViewActivity(session, row.companyId)) {
    redirect("/actividades");
  }

  const canFullEdit =
    canMutateActivities(session) && canMutateActivity(session, row.companyId);
  const canTrack = canUpdateActivityProgress(session, {
    companyId: row.companyId,
    assigneeUserId: row.assigneeUserId,
  });

  const kr = row.keyResult;
  const so = kr.strategicObjective;
  const io = so.institutionalObjective;
  const proj = io.institutionalProject;

  const progress = row.progressContribution != null ? Number(row.progressContribution) : null;
  const barPct = progress != null && !Number.isNaN(progress) ? Math.min(100, Math.max(0, progress)) : null;

  const logs = await prisma.activityProgressLog.findMany({
    where: { activityId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { changedBy: { select: { name: true, email: true } } },
  });

  const defaultProgressInput =
    row.progressContribution != null ? String(Number(row.progressContribution)) : "";

  const overdue = isActivityOverdue(row.dueDate, row.status);

  const pred = row.dependsOnActivity;
  const predStatus = row.dependsOnActivityId ? (pred?.status ?? null) : null;
  const blockedByDependency = isBlockedByPredecessor(row.dependsOnActivityId, predStatus);
  const delayedStartVsPlanned = isDelayedStartVsPlanned({
    startDate: row.startDate,
    actualStartDate: row.actualStartDate,
  });
  const plannedStartAtRisk = plannedStartPassedWhileBlocked({
    startDate: row.startDate,
    dependsOnActivityId: row.dependsOnActivityId,
    predecessorStatus: predStatus,
  });

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 px-0 text-muted-foreground"
            render={<Link href="/actividades" />}
          >
            <ArrowLeft className="size-4" />
            Volver al listado
          </Button>
          <PageHeading
            title={row.title}
            description={`${proj.title} › ${io.title} › ${so.title} › ${kr.title} · ${row.company.name}`}
          />
          <div className="flex flex-wrap items-center gap-2">
            {statusBadge(row.status)}
            {overdue ? <ActivityOverdueBadge /> : null}
            <Badge variant="outline" className="font-normal tabular-nums">
              Avance {formatProgress(progress)}
            </Badge>
            {row.impactsProgress ? (
              <Badge className="font-normal text-xs">Impacta el indicador</Badge>
            ) : (
              <Badge variant="secondary" className="font-normal text-xs">
                No impacta el indicador
              </Badge>
            )}
            {row.impactsProgress && Number(row.contributionWeight) > 0 ? (
              <Badge variant="outline" className="font-normal tabular-nums">
                Peso de impacto {row.contributionWeight.toString()}
              </Badge>
            ) : null}
            {row.dependsOnActivityId ? (
              <Badge variant="outline" className="font-normal text-xs">
                Con dependencia
              </Badge>
            ) : null}
            {blockedByDependency ? (
              <Badge
                variant="secondary"
                className="border-amber-500/30 font-normal text-xs text-amber-950 dark:text-amber-100"
              >
                Bloqueada por dependencia
              </Badge>
            ) : null}
            {row.actualStartDate ? (
              <Badge variant="outline" className="font-normal text-xs tabular-nums">
                Inicio real {formatDate(row.actualStartDate)}
              </Badge>
            ) : null}
            {delayedStartVsPlanned ? (
              <Badge variant="outline" className="font-normal text-xs text-amber-950 dark:text-amber-100">
                Atrasada por dependencia / calendario
              </Badge>
            ) : null}
            {plannedStartAtRisk && !delayedStartVsPlanned ? (
              <Badge variant="outline" className="font-normal text-xs text-amber-900 dark:text-amber-100">
                Riesgo: plan vs dependencia
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {canFullEdit ? (
            <Button className="gap-1.5" render={<Link href={`/actividades/${row.id}/edit`} />}>
              <Pencil className="size-4" />
              Editar
            </Button>
          ) : null}
        </div>
      </div>

      {canTrack ? (
        <div className="mb-6">
          <ActivityProgressPanel
            activityId={row.id}
            defaultStatus={row.status}
            defaultProgressInput={defaultProgressInput}
            blockedByDependency={blockedByDependency}
          />
        </div>
      ) : null}

      <Card className="mb-6 border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Avance registrado</CardTitle>
          <CardDescription>Visualización rápida del porcentaje cargado en la actividad.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-3 max-w-xl overflow-hidden rounded-full bg-muted/80">
            {barPct != null ? (
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/85 to-primary transition-all"
                style={{ width: `${barPct}%` }}
              />
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <ActivityProgressHistoryTimeline
          items={logs.map((log) => ({
            id: log.id,
            createdAt: log.createdAt,
            previousProgress: log.previousProgress,
            newProgress: log.newProgress,
            previousStatus: log.previousStatus,
            newStatus: log.newStatus,
            note: log.note,
            changedBy: log.changedBy,
          }))}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Detalle</CardTitle>
            <CardDescription>Alta {formatDate(row.createdAt)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {session.role === "SUPER_ADMIN" ? (
              <>
                <div>
                  <p className="text-muted-foreground">Empresa</p>
                  <p className="font-medium">{row.company.name}</p>
                </div>
                <Separator />
              </>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-muted-foreground">Inicio planificado</p>
                <p className="font-medium">{row.startDate ? formatDate(row.startDate) : "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Vencimiento</p>
                <p
                  className={cn(
                    "font-medium",
                    overdue && "text-destructive"
                  )}
                >
                  {row.dueDate ? formatDate(row.dueDate) : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Inicio real</p>
                <p className="font-medium">{row.actualStartDate ? formatDate(row.actualStartDate) : "—"}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground">Responsable</p>
              {row.assignee ? (
                <p className="font-medium">
                  {row.assignee.name}{" "}
                  <span className="text-xs font-normal text-muted-foreground">({row.assignee.email})</span>
                </p>
              ) : (
                <p className="text-muted-foreground">Sin asignar</p>
              )}
            </div>
          </CardContent>
        </Card>

        {row.dependsOnActivityId ? (
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Dependencia</CardTitle>
              <CardDescription>Fin → inicio: esta tarea espera a que otra esté hecha.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Depender de</p>
                {pred ? (
                  <Button
                    variant="link"
                    className="h-auto p-0 font-medium"
                    render={<Link href={`/actividades/${pred.id}`} />}
                  >
                    {pred.title}
                  </Button>
                ) : (
                  <p className="text-muted-foreground">Predecesora no disponible</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {pred?.status === "DONE" ? (
                  <Badge className="font-normal text-xs">Dependencia cumplida</Badge>
                ) : (
                  <Badge variant="secondary" className="font-normal text-xs">
                    Dependencia pendiente
                  </Badge>
                )}
                {blockedByDependency ? (
                  <Badge
                    variant="outline"
                    className="border-amber-500/40 font-normal text-xs text-amber-950 dark:text-amber-100"
                  >
                    Bloqueada por dependencia
                  </Badge>
                ) : null}
              </div>
              {plannedStartAtRisk ? (
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  El inicio planificado ya pasó y la predecesora sigue pendiente: el calendario original está en riesgo
                  (no se replanifica solo).
                </p>
              ) : null}
              {delayedStartVsPlanned ? (
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  El inicio real es posterior al planificado: se perdió tiempo respecto del plan (p. ej. por esperar la
                  dependencia).
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Cadena OKR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Resultado clave</p>
              <Button
                variant="link"
                className="h-auto p-0 font-medium"
                render={<Link href={`/resultados-clave/${kr.id}`} />}
              >
                {kr.title}
              </Button>
            </div>
            <div>
              <p className="text-muted-foreground">Objetivo clave</p>
              <Button
                variant="link"
                className="h-auto p-0 font-medium"
                render={<Link href={`/objetivos-clave/${so.id}`} />}
              >
                {so.title}
              </Button>
            </div>
            <div>
              <p className="text-muted-foreground">Objetivo institucional</p>
              <Button variant="link" className="h-auto p-0 font-medium" render={<Link href={`/objetivos/${io.id}`} />}>
                {io.title}
              </Button>
            </div>
            <div>
              <p className="text-muted-foreground">Proyecto</p>
              <Button
                variant="link"
                className="h-auto p-0 font-medium"
                render={<Link href={`/proyecto/${proj.id}`} />}
              >
                {proj.title}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-foreground">{row.description ?? "—"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function statusBadge(status: ActivityStatus) {
  if (status === "IN_PROGRESS") {
    return (
      <Badge className="border-sky-500/20 bg-sky-500/10 font-normal text-sky-900 dark:text-sky-100">
        {activityStatusLabel(status)}
      </Badge>
    );
  }
  if (status === "DONE") {
    return (
      <Badge className="border-emerald-500/20 bg-emerald-500/10 font-normal text-emerald-800 dark:text-emerald-200">
        {activityStatusLabel(status)}
      </Badge>
    );
  }
  if (status === "BLOCKED") {
    return (
      <Badge className="border-amber-500/25 bg-amber-500/10 font-normal text-amber-900 dark:text-amber-100">
        {activityStatusLabel(status)}
      </Badge>
    );
  }
  if (status === "CANCELLED") {
    return (
      <Badge variant="secondary" className="font-normal text-muted-foreground">
        {activityStatusLabel(status)}
      </Badge>
    );
  }
  return <Badge variant="outline" className="font-normal">{activityStatusLabel(status)}</Badge>;
}
