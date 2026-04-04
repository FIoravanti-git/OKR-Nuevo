"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { createArea, updateArea } from "@/lib/areas/actions";
import { areaCreateSchema, areaUpdateSchema } from "@/lib/areas/schemas";
import { areaStatusLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/generated/prisma";
import type { z } from "zod";

export type ManagerUserOption = {
  id: string;
  name: string;
  email: string;
  companyId: string | null;
};

export type AreaFormFieldsCreate = z.infer<typeof areaCreateSchema> & { companyId: string };
export type AreaFormFieldsEdit = z.infer<typeof areaUpdateSchema> & { companyId: string };

export type AreaFormFields = AreaFormFieldsCreate | AreaFormFieldsEdit;

type CompanyOption = { id: string; name: string };

type AreaFormProps = {
  mode: "create" | "edit";
  areaId?: string;
  viewerRole: UserRole;
  companies: CompanyOption[];
  enforcedCompanyId: string | null;
  managerOptions: ManagerUserOption[];
  defaultValues: AreaFormFields;
  cancelHref: string;
};

export function AreaForm({
  mode,
  areaId,
  viewerRole,
  companies,
  enforcedCompanyId,
  managerOptions,
  defaultValues,
  cancelHref,
}: AreaFormProps) {
  const router = useRouter();
  const resolver = useMemo(() => {
    const schema = mode === "create" ? areaCreateSchema : areaUpdateSchema;
    return zodResolver(schema) as unknown as Resolver<AreaFormFields>;
  }, [mode]);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AreaFormFields>({
    resolver,
    defaultValues,
    mode: "onTouched",
  });

  const companyIdField = useWatch({ control, name: "companyId" });
  const effectiveCompanyId =
    viewerRole === "SUPER_ADMIN" && mode === "create"
      ? (companyIdField?.trim() || "")
      : enforcedCompanyId ?? "";

  const filteredManagers = useMemo(() => {
    if (!effectiveCompanyId) return [];
    return managerOptions.filter((u) => u.companyId === effectiveCompanyId);
  }, [managerOptions, effectiveCompanyId]);

  async function onSubmit(values: AreaFormFields) {
    if (mode === "create") {
      const v = values as AreaFormFieldsCreate;
      const payload = {
        name: v.name,
        description: v.description ?? "",
        managerUserId: (v.managerUserId ?? "").trim(),
        status: v.status,
        ...(viewerRole === "SUPER_ADMIN" ? { companyId: v.companyId.trim() || undefined } : {}),
      };
      const r = await createArea(payload);
      if (!r.ok) {
        if (r.fieldErrors) {
          for (const [key, msgs] of Object.entries(r.fieldErrors)) {
            const msg = msgs?.[0];
            if (msg) setError(key as keyof AreaFormFields, { message: msg });
          }
        }
        toast.error(r.message);
        return;
      }
      if (r.createdAreaId) {
        toast.success("Área creada. Podés sumar más personas al equipo en la siguiente pantalla.");
        router.push(`/areas/${r.createdAreaId}/edit`);
        router.refresh();
        return;
      }
      toast.success("Área creada");
      router.push("/areas");
      router.refresh();
      return;
    }

    const v = values as AreaFormFieldsEdit;
    const r = await updateArea(areaId!, {
      name: v.name,
      description: v.description ?? "",
      status: v.status,
    });
    if (!r.ok) {
      if (r.fieldErrors) {
        for (const [key, msgs] of Object.entries(r.fieldErrors)) {
          const msg = msgs?.[0];
          if (msg) setError(key as keyof AreaFormFields, { message: msg });
        }
      }
      toast.error(r.message);
      return;
    }
    toast.success("Cambios guardados");
    router.push(`/areas/${areaId}`);
    router.refresh();
  }

  const showCompanySelect = viewerRole === "SUPER_ADMIN" && mode === "create";
  const showInitialResponsible = mode === "create";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      {!showCompanySelect && enforcedCompanyId ? <input type="hidden" {...register("companyId")} /> : null}
      {showCompanySelect ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Organización</CardTitle>
            <CardDescription>Elegí la empresa a la que pertenece el área.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-md">
              <Label htmlFor="area-company">Empresa</Label>
              <select
                id="area-company"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                {...register("companyId")}
              >
                <option value="">Seleccionar…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.companyId ? <p className="text-xs text-destructive">{errors.companyId.message}</p> : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Datos del área</CardTitle>
          <CardDescription>Nombre, descripción y estado.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="area-name">Nombre</Label>
            <Input
              id="area-name"
              aria-invalid={!!errors.name}
              className={cn(errors.name && "border-destructive")}
              {...register("name")}
            />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="area-desc">Descripción</Label>
            <textarea
              id="area-desc"
              rows={3}
              className={cn(
                "w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
                errors.description && "border-destructive"
              )}
              {...register("description")}
            />
            {errors.description ? <p className="text-xs text-destructive">{errors.description.message}</p> : null}
          </div>
          {showInitialResponsible ? (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="area-manager">Responsable inicial</Label>
              <select
                id="area-manager"
                disabled={!effectiveCompanyId}
                aria-invalid={!!(errors as { managerUserId?: { message?: string } }).managerUserId}
                className={cn(
                  "flex h-8 w-full max-w-xl rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 dark:bg-input/30",
                  (errors as { managerUserId?: { message?: string } }).managerUserId && "border-destructive"
                )}
                {...register("managerUserId")}
              >
                <option value="">Seleccionar…</option>
                {filteredManagers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              {showCompanySelect && !effectiveCompanyId ? (
                <p className="text-xs text-muted-foreground">Elegí primero la empresa para listar personas.</p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Podés sumar más responsables y miembros después, desde el detalle del área.
              </p>
              {(errors as { managerUserId?: { message?: string } }).managerUserId ? (
                <p className="text-xs text-destructive">
                  {(errors as { managerUserId?: { message?: string } }).managerUserId?.message}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="area-status">Estado</Label>
            <select
              id="area-status"
              className="flex h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              {...register("status")}
            >
              {(["ACTIVE", "INACTIVE"] as const).map((s) => (
                <option key={s} value={s}>
                  {areaStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => router.push(cancelHref)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Guardando…
            </>
          ) : mode === "create" ? (
            "Crear área"
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </form>
  );
}
