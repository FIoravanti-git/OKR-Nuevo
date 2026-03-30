import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { CompanyAssignPlan } from "@/components/companies/company-assign-plan";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [company, plans] = await Promise.all([
    prisma.company.findUnique({
      where: { id },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          take: 1,
          orderBy: { createdAt: "desc" },
          include: { plan: true },
        },
        _count: { select: { users: true } },
      },
    }),
    prisma.plan.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!company) notFound();

  const activeSub = company.subscriptions[0];
  const planOptions = plans.map((p) => ({ id: p.id, name: p.name, maxUsers: p.maxUsers }));

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <Button variant="ghost" size="sm" className="gap-1 px-0 text-muted-foreground" render={<Link href="/companies" />}>
            <ArrowLeft className="size-4" />
            Volver al listado
          </Button>
          <PageHeading title={company.name} description={`/${company.slug} · Alta ${formatDate(company.createdAt)}`} />
          <div className="flex flex-wrap gap-2">
            {company.isActive ? (
              <Badge className="border-emerald-500/20 bg-emerald-500/10 font-normal text-emerald-800 dark:text-emerald-200">
                Activa
              </Badge>
            ) : (
              <Badge variant="secondary" className="font-normal">
                Inactiva
              </Badge>
            )}
            <Badge variant="outline" className="font-normal tabular-nums">
              {company._count.users} usuarios / cupo {company.maxUsers}
            </Badge>
          </div>
        </div>
        <Button className="shrink-0 gap-1.5" render={<Link href={`/companies/${company.id}/edit`} />}>
          <Pencil className="size-4" />
          Editar
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Datos generales</CardTitle>
            <CardDescription>Identificación fiscal y de contacto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-1">
              <span className="text-muted-foreground">RUC / ID fiscal</span>
              <span className="font-medium">{company.ruc ?? "—"}</span>
            </div>
            <Separator />
            <div className="grid gap-1">
              <span className="text-muted-foreground">Correo</span>
              <span className="font-medium break-all">{company.email ?? "—"}</span>
            </div>
            <div className="grid gap-1">
              <span className="text-muted-foreground">Teléfono</span>
              <span className="font-medium">{company.phone ?? "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Plan y suscripción</CardTitle>
            <CardDescription>Plan activo según la suscripción vigente en base de datos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm">
              <p className="text-muted-foreground">Plan actual</p>
              <p className="text-lg font-semibold">{activeSub?.plan.name ?? "Sin plan activo"}</p>
              {activeSub?.plan.description ? (
                <p className="mt-1 text-xs text-muted-foreground">{activeSub.plan.description}</p>
              ) : null}
            </div>
            <CompanyAssignPlan
              companyId={company.id}
              plans={planOptions}
              currentPlanId={activeSub?.planId ?? null}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
