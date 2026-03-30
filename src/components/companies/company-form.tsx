"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { createCompany, updateCompany } from "@/lib/companies/actions";
import { companyCreateSchema } from "@/lib/companies/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type PlanOption = { id: string; name: string; maxUsers: number };

type CompanyFormMode = "create" | "edit";

export type CompanyFormFields = {
  name: string;
  slug: string;
  ruc: string;
  email: string;
  phone: string;
  maxUsers: number;
  planId: string;
  syncMaxFromPlan: boolean;
  isActive: boolean;
};

type CompanyFormProps = {
  mode: CompanyFormMode;
  plans: PlanOption[];
  companyId?: string;
  defaultValues: CompanyFormFields;
  cancelHref: string;
};

export function CompanyForm({ mode, plans, companyId, defaultValues, cancelHref }: CompanyFormProps) {
  const router = useRouter();

  const resolver = useMemo(
    () => zodResolver(companyCreateSchema) as Resolver<CompanyFormFields>,
    []
  );

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormFields>({
    resolver,
    defaultValues,
    mode: "onTouched",
  });

  const syncMax = watch("syncMaxFromPlan");
  const selectedPlanId = watch("planId");

  async function onSubmit(values: CompanyFormFields) {
    const r =
      mode === "create" ? await createCompany(values) : await updateCompany(companyId!, values);

    if (!r.ok) {
      if (r.fieldErrors) {
        for (const [key, msgs] of Object.entries(r.fieldErrors)) {
          const msg = msgs?.[0];
          if (msg) {
            setError(key as keyof CompanyFormFields, { message: msg });
          }
        }
      }
      toast.error(r.message);
      return;
    }

    toast.success(mode === "create" ? "Empresa creada" : "Cambios guardados");
    if (mode === "create") {
      router.push("/companies");
      router.refresh();
    } else {
      router.push(`/companies/${companyId}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Datos generales</CardTitle>
          <CardDescription>Identificación de la organización en la plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="company-name">Nombre comercial</Label>
            <Input
              id="company-name"
              autoComplete="organization"
              aria-invalid={!!errors.name}
              className={cn(errors.name && "border-destructive")}
              {...register("name")}
            />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-slug">Slug URL</Label>
            <Input
              id="company-slug"
              placeholder="mi-empresa"
              aria-invalid={!!errors.slug}
              className={cn("font-mono text-sm", errors.slug && "border-destructive")}
              {...register("slug")}
            />
            {errors.slug ? <p className="text-xs text-destructive">{errors.slug.message}</p> : null}
            <p className="text-xs text-muted-foreground">Único, minúsculas y guiones. Se usa en rutas internas.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-ruc">RUC / ID fiscal</Label>
            <Input
              id="company-ruc"
              aria-invalid={!!errors.ruc}
              className={cn(errors.ruc && "border-destructive")}
              {...register("ruc")}
            />
            {errors.ruc ? <p className="text-xs text-destructive">{errors.ruc.message}</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Contacto</CardTitle>
          <CardDescription>Datos de contacto administrativo o comercial (opcionales).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company-email">Correo</Label>
            <Input
              id="company-email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              className={cn(errors.email && "border-destructive")}
              {...register("email")}
            />
            {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-phone">Teléfono</Label>
            <Input
              id="company-phone"
              type="tel"
              autoComplete="tel"
              aria-invalid={!!errors.phone}
              className={cn(errors.phone && "border-destructive")}
              {...register("phone")}
            />
            {errors.phone ? <p className="text-xs text-destructive">{errors.phone.message}</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Plan y cupos</CardTitle>
          <CardDescription>Suscripción activa y límite de usuarios.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-plan">Plan</Label>
              <select
                id="company-plan"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                {...register("planId")}
              >
                <option value="">Sin plan</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (hasta {p.maxUsers} usuarios)
                  </option>
                ))}
              </select>
              {errors.planId ? <p className="text-xs text-destructive">{errors.planId.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-max-users">Cupo de usuarios</Label>
              <Input
                id="company-max-users"
                type="number"
                min={1}
                aria-invalid={!!errors.maxUsers}
                className={cn(errors.maxUsers && "border-destructive")}
                {...register("maxUsers", { valueAsNumber: true })}
              />
              {errors.maxUsers ? <p className="text-xs text-destructive">{errors.maxUsers.message}</p> : null}
            </div>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 rounded border-input" {...register("syncMaxFromPlan")} />
            <span>
              <span className="font-medium text-foreground">Alinear cupo con el plan</span>
              <span className="mt-0.5 block text-muted-foreground">
                Al guardar, el cupo pasará al máximo del plan seleccionado
                {selectedPlanId ? "" : " (elegí un plan primero)"}.
              </span>
            </span>
          </label>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Estado</CardTitle>
          <CardDescription>Las empresas inactivas impiden el ingreso de usuarios con esa organización.</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 rounded border-input" {...register("isActive")} />
            <span>
              <span className="font-medium text-foreground">Empresa activa</span>
              <span className="mt-0.5 block text-muted-foreground">
                Desactivá solo ante mora, cierre comercial o mantenimiento.
              </span>
            </span>
          </label>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => router.push(cancelHref)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || !!(syncMax && !String(selectedPlanId || "").trim())}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Guardando…
            </>
          ) : mode === "create" ? (
            "Crear empresa"
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </form>
  );
}
