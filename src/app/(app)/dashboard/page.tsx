import { PageHeading } from "@/components/layout/page-heading";
import { DashboardBody } from "@/components/dashboard/dashboard-body";
import { requireSessionUser } from "@/lib/auth/session-user";
import { getCompanyDashboardCharts, getPlatformDashboardCharts } from "@/lib/dashboard/charts-data";
import { getCompanyExecutiveDashboard } from "@/lib/dashboard/executive";
import { getDashboardStats } from "@/lib/dashboard/stats";
import { roleLabel } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireSessionUser();
  const stats = await getDashboardStats(user);
  const executive = user.companyId ? await getCompanyExecutiveDashboard(user.companyId) : null;
  const companyCharts =
    user.companyId && executive ? await getCompanyDashboardCharts(user.companyId, executive) : null;
  const platformCharts = user.role === "SUPER_ADMIN" ? await getPlatformDashboardCharts() : null;

  const subtitle =
    user.role === "SUPER_ADMIN"
      ? "Visión ejecutiva de la plataforma multiempresa"
      : user.companyName
        ? user.companyName
        : "Tu espacio de trabajo";

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeading title="Dashboard" description={subtitle} />
      <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span>
          Rol: <span className="font-medium text-foreground">{roleLabel(user.role)}</span>
        </span>
        <span className="hidden sm:inline" aria-hidden>
          ·
        </span>
        <span className="text-pretty">
          {user.role === "SUPER_ADMIN"
            ? "Métricas globales sin filtro de empresa."
            : "Todas las cifras están acotadas a tu organización."}
        </span>
      </div>
      <DashboardBody
        stats={stats}
        executive={executive}
        companyName={user.companyName}
        role={user.role}
        companyCharts={companyCharts}
        platformCharts={platformCharts}
      />
    </div>
  );
}
