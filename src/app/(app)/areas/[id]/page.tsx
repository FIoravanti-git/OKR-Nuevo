import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Pencil } from "lucide-react";
import { AreaMembersManage } from "@/components/areas/area-members-manage";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSessionUser } from "@/lib/auth/session-user";
import { canViewAreaRecord, canViewAreas } from "@/lib/areas/policy";
import { areaStatusLabel, formatDate, formatResponsablesList } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

export default async function AreaDetallePage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSessionUser();

  if (!canViewAreas(session)) {
    redirect("/dashboard");
  }

  const area = await prisma.area.findUnique({
    where: { id },
    include: {
      company: { select: { name: true } },
      memberLinks: {
        where: { user: { isActive: true } },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { user: { name: "asc" } },
      },
    },
  });

  if (!area) {
    notFound();
  }

  if (!canViewAreaRecord(session, area.companyId)) {
    redirect("/areas");
  }

  const responsablesCount = area.memberLinks.filter((m) => m.esResponsable).length;
  const responsableNames = area.memberLinks.filter((m) => m.esResponsable).map((m) => m.user.name);

  const members = area.memberLinks.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    role: m.user.role,
    esResponsable: m.esResponsable,
  }));

  const memberIds = members.map((m) => m.id);
  const candidates = await prisma.user.findMany({
    where: {
      companyId: area.companyId,
      isActive: true,
      ...(memberIds.length > 0 ? { id: { notIn: memberIds } } : {}),
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeading
          title={area.name}
          description={`${area.company.name} · Alta ${formatDate(area.createdAt)}`}
        />
        <Button render={<Link href={`/areas/${area.id}/edit`} />} className="gap-1.5 shrink-0">
          <Pencil className="size-4" />
          Editar
        </Button>
      </div>

      <div className="space-y-6">
        <Card className="max-w-2xl border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Resumen</CardTitle>
            <CardDescription>Datos generales del área.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Descripción</p>
              <p className="mt-1 text-foreground">{area.description?.trim() ? area.description : "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</p>
              <div className="mt-1">
                <Badge variant={area.status === "ACTIVE" ? "secondary" : "outline"} className="font-normal">
                  {areaStatusLabel(area.status)}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Responsables</p>
              {responsableNames.length > 0 ? (
                <p className="mt-1 text-foreground">{formatResponsablesList(responsableNames)}</p>
              ) : (
                <p className="mt-1 text-muted-foreground">Sin asignar</p>
              )}
            </div>
          </CardContent>
        </Card>

        <AreaMembersManage
          areaId={area.id}
          members={members}
          responsablesCount={responsablesCount}
          candidates={candidates}
          showAddSection={false}
        />
      </div>
    </div>
  );
}
