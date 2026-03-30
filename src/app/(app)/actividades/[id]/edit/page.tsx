import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ActivityForm } from "@/components/activities/activity-form";
import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { requireSessionUser } from "@/lib/auth/session-user";
import {
  canMutateActivities,
  canMutateActivity,
  canViewActivity,
} from "@/lib/activities/policy";
import { prisma } from "@/lib/prisma";
import type { AssignableUserOption, KeyResultOptionForActivity } from "@/types/activity-admin";
import type { Prisma } from "@/generated/prisma";

type PageProps = { params: Promise<{ id: string }> };

function toDateInputValue(d: Date | null | undefined): string {
  if (!d) return "";
  const x = new Date(d);
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, "0")}-${String(x.getUTCDate()).padStart(2, "0")}`;
}

export default async function EditActividadPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSessionUser();

  if (!canMutateActivities(session)) {
    redirect(`/actividades/${id}`);
  }

  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_EMPRESA") {
    redirect(`/actividades/${id}`);
  }

  const row = await prisma.activity.findUnique({
    where: { id },
    include: {
      keyResult: {
        select: {
          id: true,
          title: true,
          companyId: true,
          strategicObjective: {
            select: {
              title: true,
              institutionalObjective: {
                select: {
                  title: true,
                  institutionalProject: { select: { title: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!row) notFound();

  if (!canViewActivity(session, row.companyId)) {
    redirect("/actividades");
  }

  if (!canMutateActivity(session, row.companyId)) {
    redirect("/actividades");
  }

  const kr = row.keyResult;
  const so = kr.strategicObjective;
  const io = so.institutionalObjective;
  const p = io.institutionalProject;

  const keyResults: KeyResultOptionForActivity[] = [
    {
      id: kr.id,
      title: kr.title,
      companyId: kr.companyId,
      projectTitle: p.title,
      institutionalObjectiveTitle: io.title,
      strategicObjectiveTitle: so.title,
    },
  ];

  const usersWhere: Prisma.UserWhereInput = { isActive: true };
  if (session.role === "SUPER_ADMIN") {
    usersWhere.companyId = { not: null };
  } else if (session.companyId) {
    usersWhere.companyId = session.companyId;
  } else {
    usersWhere.id = "__none__";
  }

  const usersRaw = await prisma.user.findMany({
    where: usersWhere,
    select: { id: true, name: true, email: true, companyId: true },
    orderBy: { name: "asc" },
  });

  const users: AssignableUserOption[] = usersRaw.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    companyId: u.companyId,
  }));

  const progressStr =
    row.progressContribution != null ? String(Number(row.progressContribution)) : "";

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-1 px-0 text-muted-foreground"
          render={<Link href={`/actividades/${id}`} />}
        >
          <ArrowLeft className="size-4" />
          Volver al detalle
        </Button>
        <PageHeading
          title={`Editar · ${row.title}`}
          description="El resultado clave asociado no se puede cambiar. Los cambios de avance disparan recálculo del KR cuando impacta."
        />
      </div>
      <ActivityForm
        mode="edit"
        activityId={row.id}
        keyResults={keyResults}
        users={users}
        assigneeCompanyId={row.companyId}
        defaultValues={{
          title: row.title,
          description: row.description ?? "",
          keyResultId: row.keyResultId,
          assigneeUserId: row.assigneeUserId ?? "",
          startDate: toDateInputValue(row.startDate),
          dueDate: toDateInputValue(row.dueDate),
          status: row.status,
          impactsProgress: row.impactsProgress,
          contributionWeight: row.contributionWeight.toString(),
          progressContributionStr: progressStr,
          observation: "",
        }}
        cancelHref={`/actividades/${id}`}
      />
    </div>
  );
}
