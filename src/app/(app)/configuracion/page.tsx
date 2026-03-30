import { PageHeading } from "@/components/layout/page-heading";
import { CompanyTenantSettingsForm } from "@/components/configuracion/company-tenant-settings-form";
import { PlatformSettingsForm } from "@/components/configuracion/platform-settings-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session-user";
import { prisma } from "@/lib/prisma";
import { getPlatformConfig } from "@/lib/platform-config/data";

export default async function ConfiguracionPage() {
  const user = await requireRole("SUPER_ADMIN", "ADMIN_EMPRESA");

  if (user.role === "SUPER_ADMIN") {
    const row = await getPlatformConfig();
    const hasPersistedRow = row != null;
    const defaultValues = {
      displayName: row?.displayName ?? "",
      supportEmail: row?.supportEmail ?? "",
      noticeBanner: row?.noticeBanner ?? "",
    };

    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeading
          title="Configuración"
          description="Parámetros globales de la plataforma: nombre, soporte y avisos. Solo super administradores."
        />
        <PlatformSettingsForm hasPersistedRow={hasPersistedRow} defaultValues={defaultValues} />
      </div>
    );
  }

  if (!user.companyId) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeading
          title="Configuración"
          description="Ajustes de tu organización en la plataforma."
        />
        <Card className="border-amber-500/30 bg-amber-500/[0.06] shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-amber-950 dark:text-amber-100">Sin empresa asignada</CardTitle>
            <CardDescription className="text-amber-900/85 dark:text-amber-100/85">
              Tu usuario no tiene una organización vinculada. Pedí a un super administrador que asigne tu cuenta a una
              empresa para poder editar estos datos.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { name: true, slug: true, ruc: true, email: true, phone: true },
  });

  if (!company) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeading title="Configuración" description="Ajustes de tu organización." />
        <Card className="border-destructive/30 bg-destructive/[0.04] shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Organización no encontrada</CardTitle>
            <CardDescription>
              No existe la empresa asociada a tu usuario en la base de datos. Contactá soporte.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const defaultValues = {
    name: company.name,
    slug: company.slug,
    ruc: company.ruc ?? "",
    email: company.email ?? "",
    phone: company.phone ?? "",
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeading
        title="Configuración"
        description={`Datos de contacto e identificación de ${company.name}. Plan y cupos los gestiona el super administrador.`}
      />
      <CompanyTenantSettingsForm defaultValues={defaultValues} />
    </div>
  );
}
