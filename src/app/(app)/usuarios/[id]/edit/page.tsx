import { notFound, redirect } from "next/navigation";
import { PageHeading } from "@/components/layout/page-heading";
import { UserDeleteSection } from "@/components/usuarios/user-delete-section";
import { UserForm, type UserFormFields } from "@/components/usuarios/user-form";
import { requireSessionUser } from "@/lib/auth/session-user";
import type { UserRole } from "@/generated/prisma";
import { areaListWhere } from "@/lib/areas/policy";
import { prisma } from "@/lib/prisma";
import { adminCanManageTarget, rolesCreatableBy } from "@/lib/users/policy";
import { isUserDeletable } from "@/lib/users/user-deletion";

const ROLE_ORDER: UserRole[] = ["SUPER_ADMIN", "ADMIN_EMPRESA", "OPERADOR"];

type PageProps = { params: Promise<{ id: string }> };

export default async function EditUsuarioPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSessionUser();

  const target = await prisma.user.findUnique({
    where: { id },
    include: {
      company: { select: { name: true } },
      areaMemberships: {
        take: 1,
        orderBy: { createdAt: "asc" },
        include: { area: { select: { id: true, name: true } } },
      },
    },
  });

  if (!target) notFound();

  if (!adminCanManageTarget(session, target)) {
    redirect("/usuarios");
  }

  const [companies, areasRaw] = await Promise.all([
    session.role === "SUPER_ADMIN"
      ? prisma.company.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    prisma.area.findMany({
      where: areaListWhere(session),
      select: { id: true, name: true, companyId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const areas = areasRaw.map((a) => ({ id: a.id, name: a.name, companyId: a.companyId }));

  const roleSet = new Set<UserRole>([...rolesCreatableBy(session), target.role]);
  const allowedRoles = ROLE_ORDER.filter((r) => roleSet.has(r));

  const companiesForForm =
    session.role === "ADMIN_EMPRESA" && session.companyId
      ? [{ id: session.companyId, name: session.companyName ?? target.company?.name ?? "Tu empresa" }]
      : companies;

  const defaultValues: UserFormFields = {
    name: target.name,
    email: target.email,
    password: "",
    role: target.role,
    companyId: target.companyId ?? "",
    areaId: target.areaMemberships[0]?.areaId ?? "",
    isActive: target.isActive,
  };

  const canDeleteUser =
    session.id !== target.id ? await isUserDeletable(target.id) : false;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeading
        title={`Editar · ${target.name}`}
        description="Actualizá datos, rol y empresa según tus permisos."
      />
      <UserForm
        mode="edit"
        userId={target.id}
        sessionUserId={session.id}
        viewerRole={session.role}
        viewerCompanyId={session.companyId}
        companies={companiesForForm}
        areas={areas}
        allowedRoles={allowedRoles}
        defaultValues={defaultValues}
        cancelHref="/usuarios"
      />

      {session.id !== target.id ? (
        <div className="mt-10">
          <UserDeleteSection userId={target.id} userName={target.name} canDelete={canDeleteUser} />
        </div>
      ) : null}
    </div>
  );
}
