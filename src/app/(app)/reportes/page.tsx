import { PageHeading } from "@/components/layout/page-heading";
import { ExecutiveReportsDashboard } from "@/components/reports/executive-reports-dashboard";
import { ReportsFiltersForm } from "@/components/reports/reports-filters-form";
import { requireSessionUser } from "@/lib/auth/session-user";
import { getExecutiveReportData } from "@/lib/reports/data";
import { institutionalProjectListWhere } from "@/lib/institutional-projects/policy";
import { reportsEffectiveCompanyId } from "@/lib/reports/policy";
import { parseReportSearchParams } from "@/lib/reports/schemas";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportesPage({ searchParams }: PageProps) {
  const session = await requireSessionUser();
  const raw = (await searchParams) ?? {};
  const data = await getExecutiveReportData(session, raw);

  const sp = parseReportSearchParams(raw);
  const effectiveCompanyId = reportsEffectiveCompanyId(session, sp.companyId);

  const [companies, projectsRaw] = await Promise.all([
    session.role === "SUPER_ADMIN"
      ? prisma.company.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([] as { id: string; name: string }[]),
    prisma.institutionalProject.findMany({
      where: institutionalProjectListWhere(session),
      select: {
        id: true,
        title: true,
        companyId: true,
        company: { select: { name: true } },
      },
      orderBy: [{ companyId: "asc" }, { title: "asc" }],
    }),
  ]);

  const projectsFiltered =
    session.role === "SUPER_ADMIN" && effectiveCompanyId
      ? projectsRaw.filter((p) => p.companyId === effectiveCompanyId)
      : projectsRaw;

  const projectsForForm = projectsFiltered.map((p) => ({
    id: p.id,
    title: p.title,
    companyName: p.company.name,
  }));

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeading
        title="Reportes ejecutivos"
        description="Vista consolidada de avance OKR y carga operativa. Los datos respetan tu empresa y rol; el super administrador puede filtrar por organización."
      />

      <div className="mt-6 flex flex-col gap-8">
        <ReportsFiltersForm session={session} companies={companies} projects={projectsForForm} filters={data.filters} />
        <ExecutiveReportsDashboard session={session} data={data} />
      </div>
    </div>
  );
}
