import { PageHeading } from "@/components/layout/page-heading";
import { UserForm, type UserFormFields } from "@/components/usuarios/user-form";
import type { UserRole } from "@/generated/prisma";
import { requireSessionUser } from "@/lib/auth/session-user";
import { prisma } from "@/lib/prisma";
import { rolesCreatableBy } from "@/lib/users/policy";

const ROLE_ORDER: UserRole[] = ["SUPER_ADMIN", "ADMIN_EMPRESA", "OPERADOR"];

export default async function NuevoUsuarioPage() {
  const session = await requireSessionUser();

  const companies =
    session.role === "SUPER_ADMIN"
      ? await prisma.company.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : [];

  const creatable = rolesCreatableBy(session);
  const allowedRoles = ROLE_ORDER.filter((r) => creatable.includes(r));

  const defaultRole = allowedRoles.includes("OPERADOR") ? "OPERADOR" : allowedRoles[0] ?? "OPERADOR";

  const defaultValues: UserFormFields = {
    name: "",
    email: "",
    password: "",
    role: defaultRole,
    companyId: session.role === "ADMIN_EMPRESA" && session.companyId ? session.companyId : "",
    isActive: true,
  };

  const companiesForForm =
    session.role === "ADMIN_EMPRESA" && session.companyId
      ? [{ id: session.companyId, name: session.companyName ?? "Tu empresa" }]
      : companies;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeading
        title="Nuevo usuario"
        description={
          session.role === "SUPER_ADMIN"
            ? "Creá cuentas para cualquier empresa o para rol global de plataforma."
            : "Solo podés crear usuarios para tu organización y roles permitidos."
        }
      />
      <UserForm
        mode="create"
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
