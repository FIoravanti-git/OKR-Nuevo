import { redirect } from "next/navigation";
import { AreaForm } from "@/components/areas/area-form";
import { PageHeading } from "@/components/layout/page-heading";
import { requireSessionUser } from "@/lib/auth/session-user";
import { canMutateAreas, adminEmpresaMustHaveCompany } from "@/lib/areas/policy";
import { prisma } from "@/lib/prisma";

export default async function NuevaAreaPage() {
  const session = await requireSessionUser();

  if (!canMutateAreas(session)) {
    redirect("/dashboard");
  }

  if (adminEmpresaMustHaveCompany(session)) {
    redirect("/dashboard");
  }

  const [companies, managerUsers] = await Promise.all([
    session.role === "SUPER_ADMIN"
      ? prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
    prisma.user.findMany({
      where: {
        isActive: true,
        companyId:
          session.role === "ADMIN_EMPRESA" && session.companyId
            ? session.companyId
            : { not: null },
      },
      select: { id: true, name: true, email: true, companyId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const managerOptions = managerUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    companyId: u.companyId,
  }));

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeading
        title="Nueva área"
        description="Definí el área y, si aplica, un responsable de la misma organización."
      />
      <AreaForm
        mode="create"
        viewerRole={session.role}
        companies={companies}
        enforcedCompanyId={session.role === "ADMIN_EMPRESA" ? session.companyId : null}
        managerOptions={managerOptions}
        defaultValues={{
          name: "",
          description: "",
          managerUserId: "",
          status: "ACTIVE",
          companyId: session.role === "ADMIN_EMPRESA" && session.companyId ? session.companyId : "",
        }}
        cancelHref="/areas"
      />
    </div>
  );
}
