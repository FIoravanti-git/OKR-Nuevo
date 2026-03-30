import Link from "next/link";
import { Plus } from "lucide-react";
import { StrategicObjectivesTable } from "@/components/strategic-objectives/strategic-objectives-table";
import { PageHeading } from "@/components/layout/page-heading";
import { SuperAdminTenantNotice } from "@/components/layout/super-admin-tenant-notice";
import { Button } from "@/components/ui/button";
import { requireSessionUser } from "@/lib/auth/session-user";
import { institutionalProjectOptionsWhere } from "@/lib/institutional-objectives/policy";
import {
  canMutateStrategicObjectives,
  institutionalObjectiveOptionsWhere,
  strategicObjectiveListWhere,
} from "@/lib/strategic-objectives/policy";
import { prisma } from "@/lib/prisma";
import type {
  InstitutionalObjectiveFilterOption,
  StrategicObjectiveAdminRow,
} from "@/types/strategic-objective-admin";

type PageProps = {
  searchParams?: Promise<{ proyecto?: string; objetivoInstitucional?: string }>;
};

export default async function ObjetivosClavePage({ searchParams }: PageProps) {
  const session = await requireSessionUser();
  const sp = (await searchParams) ?? {};
  const initialProjectId = typeof sp.proyecto === "string" && sp.proyecto ? sp.proyecto : undefined;
  const initialInstitutionalObjectiveId =
    typeof sp.objetivoInstitucional === "string" && sp.objetivoInstitucional
      ? sp.objetivoInstitucional
      : undefined;

  const where = strategicObjectiveListWhere(session);
  const canMutate = canMutateStrategicObjectives(session);
  const projectWhere = institutionalProjectOptionsWhere(session);
  const ioWhere = institutionalObjectiveOptionsWhere(session);

  const [strategicRows, companies, projectsForFilter, institutionalObjectives] = await Promise.all([
    prisma.strategicObjective.findMany({
      where,
      include: {
        company: { select: { name: true } },
        institutionalObjective: {
          select: {
            id: true,
            title: true,
            institutionalProjectId: true,
            institutionalProject: { select: { title: true } },
          },
        },
        _count: { select: { keyResults: true } },
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
    prisma.institutionalObjective.findMany({
      where: ioWhere,
      select: {
        id: true,
        title: true,
        institutionalProjectId: true,
        institutionalProject: { select: { title: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    }),
  ]);

  const rows: StrategicObjectiveAdminRow[] = strategicRows.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    weight: s.weight.toString(),
    progressCached: s.progressCached != null ? Number(s.progressCached) : null,
    status: s.status,
    sortOrder: s.sortOrder,
    companyId: s.companyId,
    companyName: s.company.name,
    institutionalObjectiveId: s.institutionalObjectiveId,
    institutionalObjectiveTitle: s.institutionalObjective.title,
    institutionalProjectId: s.institutionalObjective.institutionalProjectId,
    projectTitle: s.institutionalObjective.institutionalProject.title,
    keyResultCount: s._count.keyResults,
    createdAt: s.createdAt.toISOString(),
  }));

  const ioFilterOptions: InstitutionalObjectiveFilterOption[] = institutionalObjectives.map((o) => ({
    id: o.id,
    title: o.title,
    institutionalProjectId: o.institutionalProjectId,
    projectTitle: o.institutionalProject.title,
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
        title="Objetivos clave"
        description="OKR estratégicos bajo cada objetivo institucional. Filtros por proyecto y objetivo padre; multiempresa por `company_id`."
      />
      {canMutate ? (
        <div className="mb-6 flex flex-wrap justify-end gap-2">
          <Button render={<Link href="/objetivos-clave/nuevo" />} className="gap-1.5">
            <Plus className="size-4" />
            Nuevo objetivo clave
          </Button>
        </div>
      ) : null}
      <StrategicObjectivesTable
        data={rows}
        viewerRole={session.role}
        canMutate={canMutate}
        companies={companies}
        projects={projectsForFilter}
        institutionalObjectives={ioFilterOptions}
        initialProjectId={initialProjectId}
        initialInstitutionalObjectiveId={initialInstitutionalObjectiveId}
      />
    </div>
  );
}
