import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { UsersDataTable } from "@/components/usuarios/users-data-table";
import { Button } from "@/components/ui/button";
import { requireSessionUser } from "@/lib/auth/session-user";
import { prisma } from "@/lib/prisma";
import { userListWhere } from "@/lib/users/policy";
import type { UserAdminRow } from "@/types/user-admin";

export default async function UsuariosPage() {
  const sessionUser = await requireSessionUser();
  const where = userListWhere(sessionUser);

  const [users, companies] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    sessionUser.role === "SUPER_ADMIN"
      ? prisma.company.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const rows: UserAdminRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    companyId: u.companyId,
    companyName: u.company?.name ?? null,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeading
        title="Usuarios"
        description={
          sessionUser.role === "SUPER_ADMIN"
            ? "Gestión global: roles, empresas y estado de cuenta."
            : "Usuarios de tu organización: roles y estado (sin acceso a otros tenants)."
        }
      />
      <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
        <Button render={<Link href="/usuarios/nuevo" />} className="gap-1.5">
          <Plus className="size-4" />
          Nuevo usuario
        </Button>
      </div>
      <UsersDataTable
        data={rows}
        viewerRole={sessionUser.role}
        viewerId={sessionUser.id}
        companies={companies}
      />
    </div>
  );
}
