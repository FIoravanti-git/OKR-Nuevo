import Link from "next/link";
import { Plus } from "lucide-react";
import { CompaniesDataTable } from "@/components/companies/companies-data-table";
import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import type { CompanyTableRow } from "@/types/company";

export default async function CompaniesPage() {
  const companies = await prisma.company.findMany({
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
        take: 1,
        orderBy: { createdAt: "desc" },
        include: { plan: true },
      },
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows: CompanyTableRow[] = companies.map((c) => {
    const sub = c.subscriptions[0];
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      ruc: c.ruc,
      email: c.email,
      phone: c.phone,
      isActive: c.isActive,
      planId: sub?.planId ?? null,
      planName: sub?.plan.name ?? "Sin plan",
      maxUsers: c.maxUsers,
      userCount: c._count.users,
      createdAt: c.createdAt.toISOString(),
    };
  });

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeading
        title="Empresas"
        description="Administración multiempresa: alta, planes activos, contacto y cupos por organización."
      />
      <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
        <Button render={<Link href="/companies/nueva" />} className="gap-1.5">
          <Plus className="size-4" />
          Nueva empresa
        </Button>
      </div>
      <CompaniesDataTable data={rows} />
    </div>
  );
}
