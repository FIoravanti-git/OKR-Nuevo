import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AreaForm } from "@/components/areas/area-form";
import { AreaMembersManage } from "@/components/areas/area-members-manage";
import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { requireSessionUser } from "@/lib/auth/session-user";
import { AreaDeleteSection } from "@/components/areas/area-delete-section";
import { isAreaDeletable } from "@/lib/areas/area-deletion";
import { canMutateAreas, canViewAreaRecord, adminEmpresaMustHaveCompany } from "@/lib/areas/policy";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditarAreaPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSessionUser();

  if (!canMutateAreas(session) || adminEmpresaMustHaveCompany(session)) {
    redirect("/dashboard");
  }

  const area = await prisma.area.findUnique({
    where: { id },
    include: {
      memberLinks: {
        where: { user: { isActive: true } },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { user: { name: "asc" } },
      },
    },
  });

  if (!area) {
    notFound();
  }

  if (!canViewAreaRecord(session, area.companyId)) {
    redirect("/areas");
  }

  const responsablesCount = area.memberLinks.filter((m) => m.esResponsable).length;

  const members = area.memberLinks.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    role: m.user.role,
    esResponsable: m.esResponsable,
  }));

  const memberIds = members.map((m) => m.id);
  const candidates = await prisma.user.findMany({
    where: {
      companyId: area.companyId,
      isActive: true,
      ...(memberIds.length > 0 ? { id: { notIn: memberIds } } : {}),
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  const companies =
    session.role === "SUPER_ADMIN"
      ? await prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
      : [];

  const canDeleteArea = await isAreaDeletable(area.id);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" className="gap-1.5" render={<Link href={`/areas/${id}`} />}>
          <ArrowLeft className="size-4" />
          Volver al detalle
        </Button>
        <PageHeading
          title={`Editar · ${area.name}`}
          description="Nombre, descripción y estado del área. El equipo se gestiona abajo."
        />
      </div>
      <AreaForm
        mode="edit"
        areaId={area.id}
        viewerRole={session.role}
        companies={companies}
        enforcedCompanyId={area.companyId}
        managerOptions={[]}
        defaultValues={{
          name: area.name,
          description: area.description ?? "",
          status: area.status,
          companyId: area.companyId,
        }}
        cancelHref={`/areas/${id}`}
      />

      <div className="mt-10">
        <AreaMembersManage
          areaId={area.id}
          members={members}
          responsablesCount={responsablesCount}
          candidates={candidates}
        />
      </div>

      <div className="mt-10">
        <AreaDeleteSection areaId={area.id} areaName={area.name} canDelete={canDeleteArea} />
      </div>
    </div>
  );
}
