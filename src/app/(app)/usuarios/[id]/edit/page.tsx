import { notFound, redirect } from "next/navigation";
import { PageHeading } from "@/components/layout/page-heading";
import { UserForm, type UserFormFields } from "@/components/usuarios/user-form";
import { requireSessionUser } from "@/lib/auth/session-user";
import type { UserRole } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { adminCanManageTarget, rolesCreatableBy } from "@/lib/users/policy";

const ROLE_ORDER: UserRole[] = ["SUPER_ADMIN", "ADMIN_EMPRESA", "OPERADOR"];

type PageProps = { params: Promise<{ id: string }> };

export default async function EditUsuarioPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSessionUser();

  const target = await prisma.user.findUnique({
    where: { id },
    include: { company: { select: { name: true } } },
  });

  if (!target) notFound();

  if (!adminCanManageTarget(session, target)) {
    redirect("/usuarios");
  }

  const companies =
    session.role === "SUPER_ADMIN"
      ? await prisma.company.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : [];

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
    isActive: target.isActive,
  };

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
        allowedRoles={allowedRoles}
        defaultValues={defaultValues}
        cancelHref="/usuarios"
      />
    </div>
  );
}
