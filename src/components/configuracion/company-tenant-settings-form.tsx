"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { updateMyCompanyTenantSettings } from "@/lib/companies/actions";
import { tenantCompanySettingsSchema, type TenantCompanySettingsInput } from "@/lib/companies/tenant-schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  defaultValues: TenantCompanySettingsInput;
};

export function CompanyTenantSettingsForm({ defaultValues }: Props) {
  const router = useRouter();
  const resolver = useMemo(
    () => zodResolver(tenantCompanySettingsSchema) as Resolver<TenantCompanySettingsInput>,
    []
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TenantCompanySettingsInput>({
    resolver,
    defaultValues,
    mode: "onTouched",
  });

  async function onSubmit(values: TenantCompanySettingsInput) {
    const r = await updateMyCompanyTenantSettings(values);
    if (!r.ok) {
      if (r.fieldErrors) {
        for (const [key, msgs] of Object.entries(r.fieldErrors)) {
          const msg = msgs?.[0];
          if (msg) setError(key as keyof TenantCompanySettingsInput, { message: msg });
        }
      }
      toast.error(r.message);
      return;
    }
    toast.success("Datos de la organización actualizados");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Datos de tu organización</CardTitle>
          <CardDescription>
            Nombre, identificador URL (slug) y contacto. El plan y el cupo de usuarios los gestiona el super
            administrador.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ct-name">Nombre comercial</Label>
            <Input id="ct-name" autoComplete="organization" aria-invalid={!!errors.name} {...register("name")} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ct-slug">Slug (URL)</Label>
            <Input
              id="ct-slug"
              autoComplete="off"
              spellCheck={false}
              placeholder="mi-empresa"
              aria-invalid={!!errors.slug}
              {...register("slug")}
            />
            {errors.slug ? <p className="text-xs text-destructive">{errors.slug.message}</p> : null}
            <p className="text-xs text-muted-foreground">Solo minúsculas, números y guiones. Debe ser único.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ct-ruc">Identificador fiscal (opcional)</Label>
            <Input id="ct-ruc" aria-invalid={!!errors.ruc} {...register("ruc")} />
            {errors.ruc ? <p className="text-xs text-destructive">{errors.ruc.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ct-phone">Teléfono (opcional)</Label>
            <Input id="ct-phone" type="tel" autoComplete="tel" aria-invalid={!!errors.phone} {...register("phone")} />
            {errors.phone ? <p className="text-xs text-destructive">{errors.phone.message}</p> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ct-email">Correo de contacto (opcional)</Label>
            <Input
              id="ct-email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
