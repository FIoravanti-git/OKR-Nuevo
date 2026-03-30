import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CompanyForm, type CompanyFormFields } from "@/components/companies/company-form";
import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditCompanyPage({ params }: PageProps) {
  const { id } = await params;

  const [company, plans] = await Promise.all([
    prisma.company.findUnique({
      where: { id },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.plan.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!company) notFound();

  const activeSub = company.subscriptions[0];
  const planOptions = plans.map((p) => ({ id: p.id, name: p.name, maxUsers: p.maxUsers }));

  const defaultValues: CompanyFormFields = {
    name: company.name,
    slug: company.slug,
    ruc: company.ruc ?? "",
    email: company.email ?? "",
    phone: company.phone ?? "",
    maxUsers: company.maxUsers,
    planId: activeSub?.planId ?? "",
    syncMaxFromPlan: false,
    isActive: company.isActive,
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4 gap-1 px-0 text-muted-foreground" render={<Link href={`/companies/${id}`} />}>
          <ArrowLeft className="size-4" />
          Volver al detalle
        </Button>
        <PageHeading
          title={`Editar · ${company.name}`}
          description="Actualizá datos comerciales, plan activo y estado de la organización."
        />
      </div>
      <CompanyForm
        mode="edit"
        companyId={company.id}
        plans={planOptions}
        defaultValues={defaultValues}
        cancelHref={`/companies/${id}`}
      />
    </div>
  );
}
