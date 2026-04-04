import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { KeyResultProgressHealthBadge } from "@/components/key-results/key-result-progress-health-badge";
import { AnimatedProgressBar } from "@/components/ui/animated-progress-bar";
import { RecalculateStrategicProgressButton } from "@/components/strategic-objectives/recalculate-strategic-progress-button";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireSessionUser } from "@/lib/auth/session-user";
import { formatDate, formatResponsablesList, keyResultStatusLabel, strategicObjectiveStatusLabel } from "@/lib/format";
import {
  canMutateStrategicObjective,
  canMutateStrategicObjectives,
  canViewStrategicObjective,
} from "@/lib/strategic-objectives/policy";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

function formatProgress(p: number | null): string {
  if (p == null || Number.isNaN(p)) return "Sin datos";
  return `${Number(p).toFixed(1)}%`;
}

export default async function ObjetivoClaveDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSessionUser();

  const row = await prisma.strategicObjective.findUnique({
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
      institutionalObjective: {
        select: {
          id: true,
          title: true,
          institutionalProjectId: true,
          institutionalProject: { select: { id: true, title: true } },
        },
      },
      _count: { select: { keyResults: true } },
      keyResults: {
        select: {
          id: true,
          title: true,
          status: true,
          weight: true,
          progressCached: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: 40,
      },
    },
  });

  if (!row) notFound();

  if (!canViewStrategicObjective(session, row.companyId)) {
    redirect("/objetivos-clave");
  }

  const canEdit =
    canMutateStrategicObjectives(session) && canMutateStrategicObjective(session, row.companyId);
  const canOpenAreaModule = session.role === "SUPER_ADMIN" || session.role === "ADMIN_EMPRESA";

  const progress = row.progressCached != null ? Number(row.progressCached) : null;
  const barPct = progress != null && !Number.isNaN(progress) ? Math.min(100, Math.max(0, progress)) : null;
  const io = row.institutionalObjective;
  const proj = io.institutionalProject;
  const responsablesTxt = row.area
    ? formatResponsablesList(row.area.memberLinks.map((m) => m.user.name))
    : "";

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 px-0 text-muted-foreground"
            render={<Link href="/objetivos-clave" />}
          >
            <ArrowLeft className="size-4" />
            Volver al listado
          </Button>
          <PageHeading
            title={row.title}
            description={`${proj.title} › ${io.title} · ${row.company.name}`}
          />
          <div className="flex flex-wrap items-center gap-2">
            {row.status === "ACTIVE" ? (
              <Badge className="border-emerald-500/20 bg-emerald-500/10 font-normal text-emerald-800 dark:text-emerald-200">
                {strategicObjectiveStatusLabel(row.status)}
              </Badge>
            ) : row.status === "AT_RISK" ? (
              <Badge className="border-amber-500/25 bg-amber-500/10 font-normal text-amber-900 dark:text-amber-100">
                {strategicObjectiveStatusLabel(row.status)}
              </Badge>
            ) : row.status === "COMPLETED" ? (
              <Badge className="border-sky-500/20 bg-sky-500/10 font-normal text-sky-900 dark:text-sky-100">
                {strategicObjectiveStatusLabel(row.status)}
              </Badge>
            ) : (
              <Badge variant="secondary" className="font-normal">
                {strategicObjectiveStatusLabel(row.status)}
              </Badge>
            )}
            <Badge variant="outline" className="font-normal tabular-nums">
              Peso {row.weight.toString()}
            </Badge>
            <Badge variant="outline" className="font-normal tabular-nums">
              Avance {formatProgress(progress)}
            </Badge>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {canEdit ? <RecalculateStrategicProgressButton strategicId={row.id} /> : null}
          {canEdit ? (
            <Button className="gap-1.5" render={<Link href={`/objetivos-clave/${row.id}/edit`} />}>
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
            Promedio ponderado por peso de cada resultado clave: {formatProgress(progress)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatedProgressBar value={barPct} size="lg" className="max-w-2xl" />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Cadena OKR</CardTitle>
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
            <div>
              <p className="text-muted-foreground">Proyecto institucional</p>
              <Button
                variant="link"
                className="h-auto p-0 text-base font-medium"
                render={<Link href={`/proyecto/${proj.id}`} />}
              >
                {proj.title}
              </Button>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground">Objetivo institucional</p>
              <Button
                variant="link"
                className="h-auto p-0 text-base font-medium"
                render={<Link href={`/objetivos/${io.id}`} />}
              >
                {io.title}
              </Button>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground">Área</p>
              {row.area ? (
                canOpenAreaModule ? (
                  <Button
                    variant="link"
                    className="h-auto p-0 text-base font-medium"
                    render={<Link href={`/areas/${row.area.id}`} />}
                  >
                    {row.area.name}
                  </Button>
                ) : (
                  <p className="font-medium">{row.area.name}</p>
                )
              ) : (
                <p className="text-muted-foreground">Sin área asignada</p>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground">Responsables del área</p>
              <p className="font-medium text-foreground">
                {responsablesTxt.trim() ? responsablesTxt : "Sin asignar"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Se actualizan desde el equipo del área en Organización.
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground">Resultados clave (KRs)</p>
              <p className="text-lg font-semibold tabular-nums">{row._count.keyResults}</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                render={<Link href={`/resultados-clave?objetivoClave=${row.id}`} />}
              >
                Ver todos en módulo
              </Button>
            </div>
            {row.keyResults.length > 0 ? (
              <ul className="space-y-2 border-t border-border/60 pt-3">
                {row.keyResults.map((k) => (
                  <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <Button
                      variant="link"
                      className="h-auto min-w-0 flex-1 justify-start truncate p-0 font-medium"
                      render={<Link href={`/resultados-clave/${k.id}`} />}
                    >
                      {k.title}
                    </Button>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-xs tabular-nums text-muted-foreground">
                        Peso {k.weight.toString()}
                        {k.progressCached != null ? ` · ${Number(k.progressCached).toFixed(1)}%` : ""}
                      </span>
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <Badge variant="outline" className="font-normal text-[10px]">
                          {keyResultStatusLabel(k.status)}
                        </Badge>
                        <KeyResultProgressHealthBadge
                          progressPercent={k.progressCached != null ? Number(k.progressCached) : null}
                          size="compact"
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Aún no hay resultados clave bajo este objetivo.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
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
