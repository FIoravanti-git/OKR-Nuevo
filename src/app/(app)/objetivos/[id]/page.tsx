import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { RecalculateProgressButton } from "@/components/institutional-objectives/recalculate-progress-button";
import { AnimatedProgressBar } from "@/components/ui/animated-progress-bar";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireSessionUser } from "@/lib/auth/session-user";
import {
  canMutateInstitutionalObjective,
  canMutateInstitutionalObjectives,
  canViewInstitutionalObjective,
} from "@/lib/institutional-objectives/policy";
import { formatDate, institutionalObjectiveStatusLabel, strategicObjectiveStatusLabel } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

function formatProgress(p: number | null): string {
  if (p == null || Number.isNaN(p)) return "Sin datos";
  return `${Number(p).toFixed(1)}%`;
}

export default async function ObjetivoInstitucionalDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSessionUser();

  const objective = await prisma.institutionalObjective.findUnique({
    where: { id },
    include: {
      company: { select: { name: true } },
      institutionalProject: { select: { id: true, title: true } },
      _count: { select: { strategicObjectives: true } },
      strategicObjectives: {
        select: {
          id: true,
          title: true,
          status: true,
          progressCached: true,
          weight: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: 30,
      },
    },
  });

  if (!objective) notFound();

  if (!canViewInstitutionalObjective(session, objective.companyId)) {
    redirect("/objetivos");
  }

  const canEdit =
    canMutateInstitutionalObjectives(session) &&
    canMutateInstitutionalObjective(session, objective.companyId);

  const progress = objective.progressCached != null ? Number(objective.progressCached) : null;
  const barPct = progress != null && !Number.isNaN(progress) ? Math.min(100, Math.max(0, progress)) : null;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <Button variant="ghost" size="sm" className="gap-1 px-0 text-muted-foreground" render={<Link href="/objetivos" />}>
            <ArrowLeft className="size-4" />
            Volver al listado
          </Button>
          <PageHeading
            title={objective.title}
            description={`${objective.institutionalProject.title} · ${objective.company.name}`}
          />
          <div className="flex flex-wrap items-center gap-2">
            {objective.status === "ACTIVE" ? (
              <Badge className="border-emerald-500/20 bg-emerald-500/10 font-normal text-emerald-800 dark:text-emerald-200">
                {institutionalObjectiveStatusLabel(objective.status)}
              </Badge>
            ) : objective.status === "COMPLETED" ? (
              <Badge className="border-sky-500/20 bg-sky-500/10 font-normal text-sky-900 dark:text-sky-100">
                {institutionalObjectiveStatusLabel(objective.status)}
              </Badge>
            ) : (
              <Badge variant="secondary" className="font-normal">
                {institutionalObjectiveStatusLabel(objective.status)}
              </Badge>
            )}
            <Badge variant="outline" className="font-normal tabular-nums">
              Peso {objective.weight.toString()}
            </Badge>
            <Badge variant="outline" className="font-normal tabular-nums">
              Progreso {formatProgress(progress)}
            </Badge>
            {!objective.includedInGeneralProgress ? (
              <Badge variant="secondary" className="max-w-full whitespace-normal text-center font-normal leading-snug">
                No impacta en el avance general
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {canEdit ? <RecalculateProgressButton objectiveId={objective.id} /> : null}
          {canEdit ? (
            <Button className="gap-1.5" render={<Link href={`/objetivos/${objective.id}/edit`} />}>
              <Pencil className="size-4" />
              Editar
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="mb-6 border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Avance</CardTitle>
          <CardDescription>Progreso consolidado del objetivo institucional: {formatProgress(progress)}</CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatedProgressBar value={barPct} size="lg" className="max-w-2xl" />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Resumen</CardTitle>
            <CardDescription>
              Orden {objective.sortOrder} · Alta {formatDate(objective.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {session.role === "SUPER_ADMIN" ? (
              <>
                <div>
                  <p className="text-muted-foreground">Empresa</p>
                  <p className="font-medium">{objective.company.name}</p>
                </div>
                <Separator />
              </>
            ) : null}
            <div>
              <p className="text-muted-foreground">Proyecto institucional</p>
              <Button variant="link" className="h-auto p-0 text-base font-medium" render={<Link href={`/proyecto/${objective.institutionalProject.id}`} />}>
                {objective.institutionalProject.title}
              </Button>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground">Objetivos clave vinculados</p>
              <p className="text-lg font-semibold tabular-nums">{objective._count.strategicObjectives}</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                render={
                  <Link
                    href={`/objetivos-clave?objetivoInstitucional=${objective.id}`}
                  />
                }
              >
                Ver todos en módulo
              </Button>
            </div>
            {objective.strategicObjectives.length > 0 ? (
              <ul className="space-y-2 border-t border-border/60 pt-3">
                {objective.strategicObjectives.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <Button
                      variant="link"
                      className="h-auto min-w-0 flex-1 justify-start truncate p-0 font-medium"
                      render={<Link href={`/objetivos-clave/${s.id}`} />}
                    >
                      {s.title}
                    </Button>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {strategicObjectiveStatusLabel(s.status)}
                      {s.progressCached != null
                        ? ` · ${Number(s.progressCached).toFixed(1)}%`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Aún no hay objetivos clave bajo este objetivo.</p>
            )}
            <p className="text-xs text-muted-foreground">
              El progreso mostrado puede calcularse como promedio ponderado de los avances de los objetivos clave hijos
              cuando existan datos.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-foreground">{objective.description ?? "—"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
