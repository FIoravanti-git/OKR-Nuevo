import Link from "next/link";
import { Plus } from "lucide-react";
import { InstitutionalProjectsTable } from "@/components/institutional-projects/institutional-projects-table";
import { PageHeading } from "@/components/layout/page-heading";
import { SuperAdminTenantNotice } from "@/components/layout/super-admin-tenant-notice";
import { Button } from "@/components/ui/button";
import { requireSessionUser } from "@/lib/auth/session-user";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import {
  canMutateInstitutionalProjects,
  institutionalProjectListWhere,
} from "@/lib/institutional-projects/policy";
import type { InstitutionalProjectAdminRow } from "@/types/institutional-project-admin";

export default async function ProyectoListPage() {
  const session = await requireSessionUser();
  const where = institutionalProjectListWhere(session);
  const canMutate = canMutateInstitutionalProjects(session);

  const [projects, companies] = await Promise.all([
    prisma.institutionalProject.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        _count: { select: { objectives: true } },
      },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
    }),
    session.role === "SUPER_ADMIN"
      ? prisma.company.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const rows: InstitutionalProjectAdminRow[] = projects.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    year: p.year,
    methodology: p.methodology,
    status: p.status,
    companyId: p.companyId,
    companyName: p.company.name,
    objectivesCount: p._count.objectives,
    createdAt: p.createdAt.toISOString(),
    createdAtLabel: formatDate(p.createdAt),
  }));

  const showSuperNotice = session.role === "SUPER_ADMIN" && !session.companyId;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {showSuperNotice ? (
        <div className="mb-6">
          <SuperAdminTenantNotice />
        </div>
      ) : null}
      <PageHeading
        title="Proyecto institucional"
        description={
          session.role === "SUPER_ADMIN"
            ? "Catálogo multiempresa: cada registro pertenece a una organización."
            : "Proyectos de tu empresa. Los operadores tienen acceso de lectura."
        }
      />
      {canMutate ? (
        <div className="mb-6 flex flex-wrap justify-end gap-2">
          <Button render={<Link href="/proyecto/nuevo" />} className="gap-1.5">
            <Plus className="size-4" />
            Nuevo proyecto
          </Button>
        </div>
      ) : null}
      <InstitutionalProjectsTable
        data={rows}
        viewerRole={session.role}
        canMutate={canMutate}
        companies={companies}
      />
    </div>
  );
}
