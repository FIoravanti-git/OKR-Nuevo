"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { upsertPlatformConfig } from "@/lib/platform-config/actions";
import { platformConfigFormSchema, type PlatformConfigFormInput } from "@/lib/platform-config/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  hasPersistedRow: boolean;
  defaultValues: PlatformConfigFormInput;
};

export function PlatformSettingsForm({ hasPersistedRow, defaultValues }: Props) {
  const router = useRouter();
  const resolver = useMemo(
    () => zodResolver(platformConfigFormSchema) as Resolver<PlatformConfigFormInput>,
    []
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PlatformConfigFormInput>({
    resolver,
    defaultValues,
    mode: "onTouched",
  });

  async function onSubmit(values: PlatformConfigFormInput) {
    const r = await upsertPlatformConfig(values);
    if (!r.ok) {
      if (r.fieldErrors) {
        for (const [key, msgs] of Object.entries(r.fieldErrors)) {
          const msg = msgs?.[0];
          if (msg) setError(key as keyof PlatformConfigFormInput, { message: msg });
        }
      }
      toast.error(r.message);
      return;
    }
    toast.success("Configuración global guardada");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {!hasPersistedRow ? (
        <Card className="border-amber-500/25 bg-amber-500/[0.06] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-950 dark:text-amber-100">Sin registro previo</CardTitle>
            <CardDescription className="text-amber-900/85 dark:text-amber-100/85">
              Aún no hay fila en base de datos para la plataforma. Al guardar este formulario se creará la configuración
              global.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Parámetros de plataforma</CardTitle>
          <CardDescription>
            Nombre visible, contacto de soporte y aviso opcional para todos los usuarios (texto informativo).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pf-display-name">Nombre de la plataforma</Label>
            <Input
              id="pf-display-name"
              autoComplete="organization"
              aria-invalid={!!errors.displayName}
              {...register("displayName")}
            />
            {errors.displayName ? (
              <p className="text-xs text-destructive">{errors.displayName.message}</p>
            ) : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pf-support-email">Correo de soporte (opcional)</Label>
            <Input
              id="pf-support-email"
              type="email"
              autoComplete="email"
              placeholder="soporte@ejemplo.com"
              aria-invalid={!!errors.supportEmail}
              {...register("supportEmail")}
            />
            {errors.supportEmail ? (
              <p className="text-xs text-destructive">{errors.supportEmail.message}</p>
            ) : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pf-notice">Aviso global (opcional)</Label>
            <textarea
              id="pf-notice"
              rows={4}
              aria-invalid={!!errors.noticeBanner}
              className={cn(
                "min-h-[100px] w-full resize-y rounded-lg border border-input/90 bg-background px-3 py-2 text-sm shadow-inner shadow-black/[0.02] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 disabled:opacity-60 dark:bg-input/20"
              )}
              placeholder="Mensaje breve para usuarios (mantenimiento, novedades, etc.)"
              {...register("noticeBanner")}
            />
            {errors.noticeBanner ? (
              <p className="text-xs text-destructive">{errors.noticeBanner.message}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Guardar configuración
        </Button>
      </div>
    </form>
  );
}
