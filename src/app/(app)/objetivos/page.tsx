import Link from "next/link";
import { Plus } from "lucide-react";
import { InstitutionalObjectivesTable } from "@/components/institutional-objectives/institutional-objectives-table";
import { PageHeading } from "@/components/layout/page-heading";
import { SuperAdminTenantNotice } from "@/components/layout/super-admin-tenant-notice";
import { Button } from "@/components/ui/button";
import { requireSessionUser } from "@/lib/auth/session-user";
import {
  canMutateInstitutionalObjectives,
  institutionalObjectiveListWhere,
  institutionalProjectOptionsWhere,
} from "@/lib/institutional-objectives/policy";
import { prisma } from "@/lib/prisma";
import type { InstitutionalObjectiveAdminRow } from "@/types/institutional-objective-admin";

export default async function ObjetivosInstitucionalesPage() {
  const session = await requireSessionUser();
  const where = institutionalObjectiveListWhere(session);
  const canMutate = canMutateInstitutionalObjectives(session);
  const projectWhere = institutionalProjectOptionsWhere(session);

  const [objectives, companies, projectsForFilter] = await Promise.all([
    prisma.institutionalObjective.findMany({
      where,
      include: {
        institutionalProject: { select: { id: true, title: true } },
        company: { select: { name: true } },
        _count: { select: { strategicObjectives: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    session.role === "SUPER_ADMIN"
      ? prisma.company.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    prisma.institutionalProject.findMany({
      where: projectWhere,
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const rows: InstitutionalObjectiveAdminRow[] = objectives.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    weight: o.weight.toString(),
    includedInGeneralProgress: o.includedInGeneralProgress,
    progressCached: o.progressCached != null ? Number(o.progressCached) : null,
    status: o.status,
    sortOrder: o.sortOrder,
    institutionalProjectId: o.institutionalProjectId,
    projectTitle: o.institutionalProject.title,
    companyId: o.companyId,
    companyName: o.company.name,
    strategicCount: o._count.strategicObjectives,
    createdAt: o.createdAt.toISOString(),
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
        title="Objetivos institucionales"
        description="Macro-objetivos ligados a un proyecto institucional y su empresa. Los operadores tienen vista de lectura."
      />
      {canMutate ? (
        <div className="mb-6 flex flex-wrap justify-end gap-2">
          <Button render={<Link href="/objetivos/nuevo" />} className="gap-1.5">
            <Plus className="size-4" />
            Nuevo objetivo
          </Button>
        </div>
      ) : null}
      <InstitutionalObjectivesTable
        data={rows}
        viewerRole={session.role}
        canMutate={canMutate}
        companies={companies}
        projects={projectsForFilter}
      />
    </div>
  );
}
