import { CompanyForm, type CompanyFormFields } from "@/components/companies/company-form";
import { PageHeading } from "@/components/layout/page-heading";
import { prisma } from "@/lib/prisma";

const defaultCreate: CompanyFormFields = {
  name: "",
  slug: "",
  ruc: "",
  email: "",
  phone: "",
  maxUsers: 10,
  planId: "",
  syncMaxFromPlan: false,
  isActive: true,
};

export default async function NuevaEmpresaPage() {
  const plans = await prisma.plan.findMany({ orderBy: { name: "asc" } });
  const planOptions = plans.map((p) => ({ id: p.id, name: p.name, maxUsers: p.maxUsers }));

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeading
        title="Nueva empresa"
        description="Alta de organización: slug único, contacto opcional y asociación al catálogo de planes."
      />
      <CompanyForm mode="create" plans={planOptions} defaultValues={defaultCreate} cancelHref="/companies" />
    </div>
  );
}
