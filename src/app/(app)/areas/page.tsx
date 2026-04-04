import Link from "next/link";
import { Plus } from "lucide-react";
import { AreasDataTable } from "@/components/areas/areas-data-table";
import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/session-user";
import { getAreasDeletableMap } from "@/lib/areas/area-deletion";
import { areaListWhere, canMutateAreas, canViewAreas } from "@/lib/areas/policy";
import { formatResponsablesList } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { AreaTableRow } from "@/types/area-admin";

export default async function AreasPage() {
  const session = await requireSessionUser();

  if (!canViewAreas(session)) {
    redirect("/dashboard");
  }

  const rowsRaw = await prisma.area.findMany({
    where: areaListWhere(session),
    include: {
      company: { select: { name: true } },
      _count: { select: { memberLinks: true } },
    },
    orderBy: [{ company: { name: "asc" } }, { name: "asc" }],
  });

  const areaIds = rowsRaw.map((a) => a.id);
  const respRows =
    areaIds.length === 0
      ? []
      : await prisma.areaMember.findMany({
          where: { areaId: { in: areaIds }, esResponsable: true },
          select: { areaId: true, user: { select: { name: true } } },
          orderBy: [{ areaId: "asc" }, { user: { name: "asc" } }],
        });
  const namesByArea = new Map<string, string[]>();
  for (const r of respRows) {
    const arr = namesByArea.get(r.areaId) ?? [];
    arr.push(r.user.name);
    namesByArea.set(r.areaId, arr);
  }

  const deletableMap = await getAreasDeletableMap(areaIds);

  const rows: AreaTableRow[] = rowsRaw.map((a) => {
    const names = namesByArea.get(a.id) ?? [];
    return {
      id: a.id,
      name: a.name,
      description: a.description,
      status: a.status,
      companyId: a.companyId,
      companyName: a.company.name,
      responsablesLabel: formatResponsablesList(names),
      memberCount: a._count.memberLinks,
      createdAt: a.createdAt.toISOString(),
      canDelete: deletableMap.get(a.id) ?? false,
    };
  });

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeading
        title="Áreas"
        description="Departamentos o equipos: responsables, integrantes y estado."
      />
      <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
        <Button render={<Link href="/areas/nuevo" />} className="gap-1.5">
          <Plus className="size-4" />
          Nueva área
        </Button>
      </div>
      <AreasDataTable
        data={rows}
        viewerRole={session.role}
        viewerCanMutate={canMutateAreas(session)}
      />
    </div>
  );
}
