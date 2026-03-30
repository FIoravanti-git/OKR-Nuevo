import Link from "next/link";
import { Plus } from "lucide-react";
import { KeyResultsTable } from "@/components/key-results/key-results-table";
import { PageHeading } from "@/components/layout/page-heading";
import { SuperAdminTenantNotice } from "@/components/layout/super-admin-tenant-notice";
import { Button } from "@/components/ui/button";
import { requireSessionUser } from "@/lib/auth/session-user";
import {
  canMutateKeyResults,
  keyResultListWhere,
  keyResultProjectFilterWhere,
  strategicObjectiveOptionsWhere,
} from "@/lib/key-results/policy";
import { institutionalObjectiveOptionsWhere } from "@/lib/strategic-objectives/policy";
import { prisma } from "@/lib/prisma";
import type {
  InstitutionalObjectiveFilterOption,
  KeyResultAdminRow,
  StrategicObjectiveFilterOption,
} from "@/types/key-result-admin";

type PageProps = {
  searchParams?: Promise<{
    proyecto?: string;
    objetivoInstitucional?: string;
    objetivoClave?: string;
  }>;
};

export default async function ResultadosClavePage({ searchParams }: PageProps) {
  const session = await requireSessionUser();
  const sp = (await searchParams) ?? {};
  const initialProjectId = typeof sp.proyecto === "string" && sp.proyecto ? sp.proyecto : undefined;
  const initialInstitutionalObjectiveId =
    typeof sp.objetivoInstitucional === "string" && sp.objetivoInstitucional
      ? sp.objetivoInstitucional
      : undefined;
  const initialStrategicObjectiveId =
    typeof sp.objetivoClave === "string" && sp.objetivoClave ? sp.objetivoClave : undefined;

  const where = keyResultListWhere(session);
  const canMutate = canMutateKeyResults(session);
  const projectWhere = keyResultProjectFilterWhere(session);
  const ioWhere = institutionalObjectiveOptionsWhere(session);
  const strategicWhere = strategicObjectiveOptionsWhere(session);

  const [keyRows, companies, projectsForFilter, institutionalObjectives, strategicObjectives] = await Promise.all([
    prisma.keyResult.findMany({
      where,
      include: {
        company: { select: { name: true } },
        strategicObjective: {
          select: {
            id: true,
            title: true,
            institutionalObjectiveId: true,
            institutionalObjective: {
              select: {
                id: true,
                title: true,
                institutionalProjectId: true,
                institutionalProject: { select: { title: true } },
              },
            },
          },
        },
        _count: { select: { activities: true } },
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
    prisma.strategicObjective.findMany({
      where: strategicWhere,
      select: {
        id: true,
        title: true,
        institutionalObjectiveId: true,
        institutionalObjective: {
          select: {
            id: true,
            title: true,
            institutionalProjectId: true,
            institutionalProject: { select: { title: true } },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    }),
  ]);

  const rows: KeyResultAdminRow[] = keyRows.map((k) => {
    const s = k.strategicObjective;
    const io = s.institutionalObjective;
    const p = io.institutionalProject;
    return {
      id: k.id,
      title: k.title,
      description: k.description,
      metricType: k.metricType,
      weight: k.weight.toString(),
      initialValue: k.initialValue != null ? Number(k.initialValue) : null,
      targetValue: k.targetValue != null ? Number(k.targetValue) : null,
      currentValue: k.currentValue != null ? Number(k.currentValue) : null,
      targetDirection: k.targetDirection,
      unit: k.unit,
      progressCached: k.progressCached != null ? Number(k.progressCached) : null,
      status: k.status,
      calculationMode: k.calculationMode,
      progressMode: k.progressMode,
      allowActivityImpact: k.allowActivityImpact,
      sortOrder: k.sortOrder,
      companyId: k.companyId,
      companyName: k.company.name,
      strategicObjectiveId: s.id,
      strategicObjectiveTitle: s.title,
      institutionalObjectiveId: io.id,
      institutionalObjectiveTitle: io.title,
      institutionalProjectId: io.institutionalProjectId,
      projectTitle: p.title,
      activityCount: k._count.activities,
      createdAt: k.createdAt.toISOString(),
    };
  });

  const ioFilterOptions: InstitutionalObjectiveFilterOption[] = institutionalObjectives.map((o) => ({
    id: o.id,
    title: o.title,
    institutionalProjectId: o.institutionalProjectId,
    projectTitle: o.institutionalProject.title,
  }));

  const strategicFilterOptions: StrategicObjectiveFilterOption[] = strategicObjectives.map((s) => {
    const io = s.institutionalObjective;
    const p = io.institutionalProject;
    return {
      id: s.id,
      title: s.title,
      institutionalObjectiveId: io.id,
      institutionalObjectiveTitle: io.title,
      institutionalProjectId: io.institutionalProjectId,
      projectTitle: p.title,
    };
  });

  const showSuperNotice = session.role === "SUPER_ADMIN" && !session.companyId;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {showSuperNotice ? (
        <div className="mb-6">
          <SuperAdminTenantNotice />
        </div>
      ) : null}
      <PageHeading
        title="Resultados clave"
        description="Indicadores medibles (KR) bajo objetivos clave: métricas, modos de cálculo manual / automático / híbrido y preparación para impacto desde actividades."
      />
      {canMutate ? (
        <div className="mb-6 flex flex-wrap justify-end gap-2">
          <Button render={<Link href="/resultados-clave/nuevo" />} className="gap-1.5">
            <Plus className="size-4" />
            Nuevo resultado clave
          </Button>
        </div>
      ) : null}
      <KeyResultsTable
        data={rows}
        viewerRole={session.role}
        canMutate={canMutate}
        companies={companies}
        projects={projectsForFilter}
        institutionalObjectives={ioFilterOptions}
        strategicObjectives={strategicFilterOptions}
        initialProjectId={initialProjectId}
        initialInstitutionalObjectiveId={initialInstitutionalObjectiveId}
        initialStrategicObjectiveId={initialStrategicObjectiveId}
      />
    </div>
  );
}
