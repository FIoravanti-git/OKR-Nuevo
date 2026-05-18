"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { AppBrandMark } from "@/components/branding/app-brand-mark";
import { upsertAppBranding } from "@/lib/app-branding/actions";
import { appBrandingFormSchema, type AppBrandingFormInput } from "@/lib/app-branding/schemas";
import { getDefaultAppBranding } from "@/lib/app-branding/defaults";
import type { AppBrandingConfig } from "@/lib/app-branding/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  hasPersistedRow: boolean;
  defaultValues: AppBrandingFormInput;
};

export function GlobalBrandingForm({ hasPersistedRow, defaultValues }: Props) {
  const router = useRouter();
  const resolver = useMemo(() => zodResolver(appBrandingFormSchema) as Resolver<AppBrandingFormInput>, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AppBrandingFormInput>({
    resolver,
    defaultValues,
    mode: "onTouched",
  });

  const watched = watch();
  const brandingDefaults = getDefaultAppBranding();
  const previewBranding: AppBrandingConfig = {
    appName: watched.appName?.trim() || defaultValues.appName || brandingDefaults.appName,
    logoUrl: watched.logoUrl?.trim() || null,
    logoAlt: watched.logoAlt?.trim() || null,
    faviconUrl: watched.faviconUrl?.trim() || null,
    primaryColor: watched.primaryColor?.trim() || defaultValues.primaryColor || brandingDefaults.primaryColor,
    secondaryColor: watched.secondaryColor?.trim() || defaultValues.secondaryColor || brandingDefaults.secondaryColor,
  };

  const [logoPreviewError, setLogoPreviewError] = useState(false);

  async function onSubmit(values: AppBrandingFormInput) {
    const r = await upsertAppBranding(values);
    if (!r.ok) {
      if (r.fieldErrors) {
        for (const [key, msgs] of Object.entries(r.fieldErrors)) {
          const msg = msgs?.[0];
          if (msg) setError(key as keyof AppBrandingFormInput, { message: msg });
        }
      }
      toast.error(r.message);
      return;
    }
    toast.success("Marca global guardada");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6" noValidate>
      <div>
        <h2 className="font-heading text-lg font-semibold tracking-tight">Marca global del sistema</h2>
          <p className="text-sm text-muted-foreground">
          Logo, nombre y colores de toda la plataforma. Podés guardar cambios parciales; los campos vacíos no borran lo
          ya guardado.
        </p>
      </div>

      {!hasPersistedRow ? (
        <Card className="border-amber-500/25 bg-amber-500/[0.06] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-950 dark:text-amber-100">Valores por defecto</CardTitle>
            <CardDescription className="text-amber-900/85 dark:text-amber-100/85">
              Aún no hay marca guardada en base de datos. Al guardar se aplicará en login, panel y landing.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Vista previa</CardTitle>
          <CardDescription>Así se verá el encabezado con los datos actuales del formulario.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <AppBrandMark branding={previewBranding} variant="sidebar" subtitle="Enterprise" />
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <AppBrandMark branding={previewBranding} variant="landing" />
          </div>
          {previewBranding.logoUrl && !logoPreviewError ? (
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Logo</p>
              <img
                src={previewBranding.logoUrl}
                alt={previewBranding.logoAlt ?? previewBranding.appName}
                className="max-h-16 max-w-[200px] object-contain"
                onError={() => setLogoPreviewError(true)}
                onLoad={() => setLogoPreviewError(false)}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Identidad</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="gb-app-name">Nombre de la aplicación (opcional)</Label>
            <Input id="gb-app-name" {...register("appName")} aria-invalid={!!errors.appName} />
            {errors.appName ? <p className="text-xs text-destructive">{errors.appName.message}</p> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="gb-logo-url">URL del logo (opcional)</Label>
            <Input id="gb-logo-url" placeholder="https://..." {...register("logoUrl")} />
            {errors.logoUrl ? <p className="text-xs text-destructive">{errors.logoUrl.message}</p> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="gb-logo-alt">Texto alternativo del logo</Label>
            <Input id="gb-logo-alt" placeholder="Nombre para lectores de pantalla" {...register("logoAlt")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="gb-favicon-url">URL del ícono (opcional)</Label>
            <Input id="gb-favicon-url" placeholder="https://.../favicon.png" {...register("faviconUrl")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gb-primary">Color principal (opcional)</Label>
            <div className="flex gap-2">
              <Input
                id="gb-primary"
                type="color"
                className="h-10 w-14 shrink-0 p-1"
                value={watched.primaryColor}
                onChange={(e) => setValue("primaryColor", e.target.value, { shouldValidate: true })}
              />
              <Input {...register("primaryColor")} aria-invalid={!!errors.primaryColor} className="font-mono text-sm" />
            </div>
            {errors.primaryColor ? <p className="text-xs text-destructive">{errors.primaryColor.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="gb-secondary">Color secundario (opcional)</Label>
            <div className="flex gap-2">
              <Input
                id="gb-secondary"
                type="color"
                className="h-10 w-14 shrink-0 p-1"
                value={watched.secondaryColor}
                onChange={(e) => setValue("secondaryColor", e.target.value, { shouldValidate: true })}
              />
              <Input {...register("secondaryColor")} aria-invalid={!!errors.secondaryColor} className="font-mono text-sm" />
            </div>
            {errors.secondaryColor ? <p className="text-xs text-destructive">{errors.secondaryColor.message}</p> : null}
          </div>
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Guardar marca global
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
