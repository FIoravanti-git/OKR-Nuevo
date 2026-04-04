import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { KeyResultProgressHealthBadge } from "@/components/key-results/key-result-progress-health-badge";
import { AnimatedProgressBar } from "@/components/ui/animated-progress-bar";
import { RecalculateKeyResultButton } from "@/components/key-results/recalculate-key-result-button";
import { KeyResultProgressHistoryTimeline } from "@/components/progress-history/progress-history-timelines";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireSessionUser } from "@/lib/auth/session-user";
import {
  activityStatusLabel,
  formatDate,
  formatResponsablesList,
  formatAmount,
  keyResultCalculationModeLabel,
  keyResultMetricTypeLabel,
  keyResultStatusLabel,
  keyResultTargetDirectionLabel,
  progressCalculationModeLabel,
} from "@/lib/format";
import { linearMetricProgress } from "@/lib/okr/metric-progress";
import { canMutateKeyResult, canMutateKeyResults, canViewKeyResult } from "@/lib/key-results/policy";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

function formatProgress(p: number | null): string {
  if (p == null || Number.isNaN(p)) return "Sin datos";
  return `${Number(p).toFixed(1)}%`;
}

function formatMetricValue(value: number | null, metricType: string): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (metricType === "CURRENCY") return formatAmount(value);
  return String(value);
}

export default async function ResultadoClaveDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSessionUser();

  const row = await prisma.keyResult.findUnique({
    where: { id },
    include: {
      company: { select: { name: true } },
      area: {
        select: {
          id: true,
          name: true,
          memberLinks: {
            where: { esResponsable: true, user: { isActive: true } },
            select: { user: { select: { name: true } } },
          },
        },
      },
      strategicObjective: {
        select: {
          id: true,
          title: true,
          areaId: true,
          area: {
            select: {
              id: true,
              name: true,
              memberLinks: {
                where: { esResponsable: true, user: { isActive: true } },
                select: { user: { select: { name: true } } },
              },
            },
          },
          institutionalObjectiveId: true,
          institutionalObjective: {
            select: {
              id: true,
              title: true,
              institutionalProjectId: true,
              institutionalProject: { select: { id: true, title: true } },
            },
          },
        },
      },
      _count: { select: { activities: true } },
      activities: {
        select: {
          id: true,
          title: true,
          status: true,
          progressContribution: true,
          assignee: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 25,
      },
    },
  });

  if (!row) notFound();

  if (!canViewKeyResult(session, row.companyId)) {
    redirect("/resultados-clave");
  }

  const canEdit = canMutateKeyResults(session) && canMutateKeyResult(session, row.companyId);
  const canOpenAreaModule = session.role === "SUPER_ADMIN" || session.role === "ADMIN_EMPRESA";

  const progress = row.progressCached != null ? Number(row.progressCached) : null;
  const so = row.strategicObjective;
  const io = so.institutionalObjective;
  const proj = io.institutionalProject;
  const effectiveArea = row.area ?? so.area;
  const areaInherited = !row.area && Boolean(so.area);
  const responsablesTxt = effectiveArea
    ? formatResponsablesList(effectiveArea.memberLinks.map((m) => m.user.name))
    : "";

  const linearPreview = linearMetricProgress(
    row.initialValue != null ? Number(row.initialValue) : null,
    row.currentValue != null ? Number(row.currentValue) : null,
    row.targetValue != null ? Number(row.targetValue) : null,
    row.targetDirection
  );

  const barPct = progress != null && !Number.isNaN(progress) ? Math.min(100, Math.max(0, progress)) : null;

  const krLogs = await prisma.keyResultProgressLog.findMany({
    where: { keyResultId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { changedBy: { select: { name: true, email: true } } },
  });

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 px-0 text-muted-foreground"
            render={<Link href="/resultados-clave" />}
          >
            <ArrowLeft className="size-4" />
            Volver al listado
          </Button>
          <PageHeading
            title={row.title}
            description={`${proj.title} › ${io.title} › ${so.title} · ${row.company.name}`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-normal">
              {keyResultMetricTypeLabel(row.metricType)}
            </Badge>
            {row.status === "ON_TRACK" ? (
              <Badge className="border-emerald-500/20 bg-emerald-500/10 font-normal text-emerald-800 dark:text-emerald-200">
                {keyResultStatusLabel(row.status)}
              </Badge>
            ) : row.status === "AT_RISK" ? (
              <Badge className="border-amber-500/25 bg-amber-500/10 font-normal text-amber-900 dark:text-amber-100">
                {keyResultStatusLabel(row.status)}
              </Badge>
            ) : row.status === "COMPLETED" ? (
              <Badge className="border-sky-500/20 bg-sky-500/10 font-normal text-sky-900 dark:text-sky-100">
                {keyResultStatusLabel(row.status)}
              </Badge>
            ) : (
              <Badge variant="secondary" className="font-normal">
                {keyResultStatusLabel(row.status)}
              </Badge>
            )}
            <KeyResultProgressHealthBadge progressPercent={progress} />
            <Badge className="border-violet-500/15 bg-violet-500/8 font-normal text-xs">
              {keyResultCalculationModeLabel(row.calculationMode)}
            </Badge>
            <Badge variant="outline" className="font-normal tabular-nums">
              Peso {row.weight.toString()}
            </Badge>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {canEdit ? (
            <RecalculateKeyResultButton keyResultId={row.id} calculationMode={row.calculationMode} />
          ) : null}
          {canEdit ? (
            <Button className="gap-1.5" render={<Link href={`/resultados-clave/${row.id}/edit`} />}>
              <Pencil className="size-4" />
              Editar
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="mb-6 border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Avance</CardTitle>
          <CardDescription>
            Progreso consolidado {formatProgress(progress)}
            {row.calculationMode !== "MANUAL" && linearPreview != null
              ? ` · Por métrica (calculado) ${linearPreview.toFixed(1)}%`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatedProgressBar value={barPct} size="lg" className="max-w-2xl" />
        </CardContent>
      </Card>

      <div className="mb-6">
        <KeyResultProgressHistoryTimeline
          items={krLogs.map((log) => ({
            id: log.id,
            createdAt: log.createdAt,
            source: log.source,
            previousProgress: log.previousProgress,
            newProgress: log.newProgress,
            previousCurrentValue: log.previousCurrentValue,
            newCurrentValue: log.newCurrentValue,
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
            <CardTitle className="text-base">Métrica y cálculo</CardTitle>
            <CardDescription>
              Orden {row.sortOrder} · Alta {formatDate(row.createdAt)}
            </CardDescription>
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
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-muted-foreground">Inicial</p>
                <p className="font-medium tabular-nums">
                  {formatMetricValue(row.initialValue != null ? Number(row.initialValue) : null, row.metricType)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Actual</p>
                <p className="font-medium tabular-nums">
                  {formatMetricValue(row.currentValue != null ? Number(row.currentValue) : null, row.metricType)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Meta</p>
                <p className="font-medium tabular-nums">
                  {formatMetricValue(row.targetValue != null ? Number(row.targetValue) : null, row.metricType)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Dirección de meta</p>
              <p className="font-medium">{keyResultTargetDirectionLabel(row.targetDirection)}</p>
            </div>
            {row.unit ? (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground">Unidad</p>
                  <p className="font-medium">{row.unit}</p>
                </div>
              </>
            ) : null}
            <Separator />
            <div>
              <p className="text-muted-foreground">Agregación desde actividades</p>
              <p className="font-medium">{progressCalculationModeLabel(row.progressMode)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Impacto permitido: {row.allowActivityImpact ? "sí" : "no"} · Actividades vinculadas:{" "}
                {row._count.activities}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Cadena OKR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Proyecto</p>
              <Button variant="link" className="h-auto p-0 font-medium" render={<Link href={`/proyecto/${proj.id}`} />}>
                {proj.title}
              </Button>
            </div>
            <div>
              <p className="text-muted-foreground">Objetivo institucional</p>
              <Button variant="link" className="h-auto p-0 font-medium" render={<Link href={`/objetivos/${io.id}`} />}>
                {io.title}
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
            <Separator />
            <div>
              <p className="text-muted-foreground">Área</p>
              {effectiveArea ? (
                <>
                  {canOpenAreaModule ? (
                    <Button
                      variant="link"
                      className="h-auto p-0 font-medium"
                      render={<Link href={`/areas/${effectiveArea.id}`} />}
                    >
                      {effectiveArea.name}
                    </Button>
                  ) : (
                    <p className="font-medium">{effectiveArea.name}</p>
                  )}
                  {areaInherited ? (
                    <p className="mt-1 text-xs text-muted-foreground">Misma área que el objetivo clave</p>
                  ) : null}
                </>
              ) : (
                <p className="text-muted-foreground">Sin área asignada</p>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground">Responsables del área</p>
              <p className="font-medium">{responsablesTxt.trim() ? responsablesTxt : "Sin asignar"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Coinciden con el equipo responsable del área en Organización.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Actividades</CardTitle>
            <CardDescription>
              {row._count.activities} vinculadas · seguimiento operativo bajo este resultado clave.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              render={<Link href={`/actividades?resultadoClave=${row.id}`} />}
            >
              Ver todas en módulo
            </Button>
            {row.activities.length > 0 ? (
              <ul className="space-y-2 border-t border-border/60 pt-3">
                {row.activities.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <Button
                      variant="link"
                      className="h-auto min-w-0 flex-1 justify-start truncate p-0 font-medium"
                      render={<Link href={`/actividades/${a.id}`} />}
                    >
                      {a.title}
                    </Button>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {activityStatusLabel(a.status)}
                      {a.assignee?.name ? ` · ${a.assignee.name}` : ""}
                      {a.progressContribution != null
                        ? ` · ${Number(a.progressContribution).toFixed(0)}%`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No hay actividades aún.</p>
            )}
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
