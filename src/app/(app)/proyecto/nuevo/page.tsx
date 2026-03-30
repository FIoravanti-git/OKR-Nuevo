import { redirect } from "next/navigation";
import { InstitutionalProjectForm } from "@/components/institutional-projects/institutional-project-form";
import { PageHeading } from "@/components/layout/page-heading";
import { requireSessionUser } from "@/lib/auth/session-user";
import { prisma } from "@/lib/prisma";
import { canMutateInstitutionalProjects } from "@/lib/institutional-projects/policy";

export default async function NuevoProyectoInstitucionalPage() {
  const session = await requireSessionUser();

  if (!canMutateInstitutionalProjects(session)) {
    redirect("/proyecto");
  }

  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_EMPRESA") {
    redirect("/proyecto");
  }

  const companies =
    session.role === "SUPER_ADMIN"
      ? await prisma.company.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : [];

  if (session.role === "ADMIN_EMPRESA" && !session.companyId) {
    redirect("/dashboard");
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeading
        title="Nuevo proyecto institucional"
        description="Definí nombre, año, metodología y vínculo con la organización."
      />
      <InstitutionalProjectForm
        mode="create"
        viewerRole={session.role}
        companies={companies}
        defaultValues={{
          title: "",
          description: "",
          mission: "",
          vision: "",
          year: "",
          methodology: "",
          status: "DRAFT",
          companyId: session.role === "ADMIN_EMPRESA" ? session.companyId! : "",
        }}
        cancelHref="/proyecto"
      />
    </div>
  );
}
