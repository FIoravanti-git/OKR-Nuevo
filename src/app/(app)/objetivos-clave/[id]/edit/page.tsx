import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StrategicObjectiveForm } from "@/components/strategic-objectives/strategic-objective-form";
import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { requireSessionUser } from "@/lib/auth/session-user";
import {
  canMutateStrategicObjective,
  canMutateStrategicObjectives,
  canViewStrategicObjective,
} from "@/lib/strategic-objectives/policy";
import { areaListWhere } from "@/lib/areas/policy";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditObjetivoClavePage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSessionUser();

  if (!canMutateStrategicObjectives(session)) {
    redirect(`/objetivos-clave/${id}`);
  }

  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_EMPRESA") {
    redirect(`/objetivos-clave/${id}`);
  }

  const row = await prisma.strategicObjective.findUnique({
    where: { id },
    include: {
      institutionalObjective: {
        select: {
          title: true,
          institutionalProject: { select: { title: true } },
          company: { select: { name: true } },
        },
      },
    },
  });

  if (!row) notFound();

  if (!canViewStrategicObjective(session, row.companyId)) {
    redirect("/objetivos-clave");
  }

  if (!canMutateStrategicObjective(session, row.companyId)) {
    redirect("/objetivos-clave");
  }

  const io = row.institutionalObjective;
  const institutionalObjectives = [
    {
      id: row.institutionalObjectiveId,
      title: io.title,
      projectTitle: io.institutionalProject.title,
      companyName: io.company.name,
      companyId: row.companyId,
    },
  ];

  const areasRaw = await prisma.area.findMany({
    where: areaListWhere(session),
    select: { id: true, name: true, companyId: true },
    orderBy: { name: "asc" },
  });
  const areaOptions = areasRaw.map((a) => ({
    id: a.id,
    name: a.name,
    companyId: a.companyId,
  }));

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-1 px-0 text-muted-foreground"
          render={<Link href={`/objetivos-clave/${id}`} />}
        >
          <ArrowLeft className="size-4" />
          Volver al detalle
        </Button>
        <PageHeading
          title={`Editar · ${row.title}`}
          description="El objetivo institucional padre no se puede cambiar para preservar la jerarquía OKR."
        />
      </div>
      <StrategicObjectiveForm
        mode="edit"
        strategicId={row.id}
        viewerRole={session.role}
        institutionalObjectives={institutionalObjectives}
        areaOptions={areaOptions}
        defaultValues={{
          title: row.title,
          description: row.description ?? "",
          weight: row.weight.toString(),
          sortOrder: String(row.sortOrder),
          institutionalObjectiveId: row.institutionalObjectiveId,
          status: row.status,
          areaId: row.areaId ?? "",
        }}
        cancelHref={`/objetivos-clave/${id}`}
      />
    </div>
  );
}
