import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { KeyResultForm } from "@/components/key-results/key-result-form";
import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { requireSessionUser } from "@/lib/auth/session-user";
import { formatResponsablesFromAreaMemberLinks } from "@/lib/areas/responsables-display";
import { canMutateKeyResult, canMutateKeyResults, canViewKeyResult } from "@/lib/key-results/policy";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditResultadoClavePage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSessionUser();

  if (!canMutateKeyResults(session)) {
    redirect(`/resultados-clave/${id}`);
  }

  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_EMPRESA") {
    redirect(`/resultados-clave/${id}`);
  }

  const row = await prisma.keyResult.findUnique({
    where: { id },
    include: {
      strategicObjective: {
        select: {
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
          institutionalObjective: {
            select: {
              title: true,
              institutionalProject: { select: { title: true } },
              company: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!row) notFound();

  if (!canViewKeyResult(session, row.companyId)) {
    redirect("/resultados-clave");
  }

  if (!canMutateKeyResult(session, row.companyId)) {
    redirect("/resultados-clave");
  }

  const so = row.strategicObjective;
  const io = so.institutionalObjective;
  const strategicObjectives = [
    {
      id: row.strategicObjectiveId,
      title: so.title,
      projectTitle: io.institutionalProject.title,
      institutionalObjectiveTitle: io.title,
      companyName: io.company.name,
      companyId: row.companyId,
      areaId: so.areaId,
      areaName: so.area?.name ?? null,
      areaResponsablesLabel: formatResponsablesFromAreaMemberLinks(so.area?.memberLinks),
    },
  ];

  const manualProgressStr =
    row.calculationMode === "MANUAL"
      ? row.progressCached != null
        ? String(Number(row.progressCached))
        : "0"
      : "";

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-1 px-0 text-muted-foreground"
          render={<Link href={`/resultados-clave/${id}`} />}
        >
          <ArrowLeft className="size-4" />
          Volver al detalle
        </Button>
        <PageHeading
          title={`Editar · ${row.title}`}
          description="El objetivo clave padre no se puede cambiar. El área del resultado sigue al objetivo clave."
        />
      </div>
      <KeyResultForm
        mode="edit"
        keyResultId={row.id}
        viewerRole={session.role}
        strategicObjectives={strategicObjectives}
        defaultValues={{
          title: row.title,
          description: row.description ?? "",
          metricType: row.metricType,
          weight: row.weight.toString(),
          sortOrder: String(row.sortOrder),
          strategicObjectiveId: row.strategicObjectiveId,
          status: row.status,
          unit: row.unit ?? "",
          initialValue: row.initialValue != null ? row.initialValue.toString() : "",
          targetValue: row.targetValue != null ? row.targetValue.toString() : "",
          currentValue: row.currentValue != null ? row.currentValue.toString() : "",
          targetDirection: row.targetDirection,
          calculationMode: row.calculationMode,
          progressMode: row.progressMode,
          allowActivityImpact: row.allowActivityImpact,
          manualProgress: manualProgressStr,
          progressChangeNote: "",
        }}
        cancelHref={`/resultados-clave/${id}`}
      />
    </div>
  );
}
