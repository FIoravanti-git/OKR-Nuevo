"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import type { InstitutionalProjectStatus } from "@/generated/prisma";
import {
  createInstitutionalProject,
  updateInstitutionalProject,
} from "@/lib/institutional-projects/actions";
import {
  institutionalProjectFormSchema,
  type InstitutionalProjectFormValues,
} from "@/lib/institutional-projects/schemas";
import { institutionalProjectStatusLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type CompanyOption = { id: string; name: string };

export type InstitutionalProjectFormFields = {
  title: string;
  description: string;
  mission: string;
  vision: string;
  year: string;
  methodology: string;
  status: InstitutionalProjectStatus;
  companyId: string;
};

type InstitutionalProjectFormProps = {
  mode: "create" | "edit";
  projectId?: string;
  viewerRole: "SUPER_ADMIN" | "ADMIN_EMPRESA";
  companies: CompanyOption[];
  defaultValues: InstitutionalProjectFormFields;
  cancelHref: string;
};

export function InstitutionalProjectForm({
  mode,
  projectId,
  viewerRole,
  companies,
  defaultValues,
  cancelHref,
}: InstitutionalProjectFormProps) {
  const router = useRouter();
  const resolver = useMemo(
    () =>
      zodResolver(institutionalProjectFormSchema) as Resolver<
        InstitutionalProjectFormFields,
        unknown,
        InstitutionalProjectFormValues
      >,
    []
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InstitutionalProjectFormFields, unknown, InstitutionalProjectFormValues>({
    resolver,
    defaultValues,
    mode: "onTouched",
  });

  async function onSubmit(values: InstitutionalProjectFormValues) {
    const r =
      mode === "create"
        ? await createInstitutionalProject(values)
        : await updateInstitutionalProject(projectId!, values);

    if (!r.ok) {
      if (r.fieldErrors) {
        for (const [key, msgs] of Object.entries(r.fieldErrors)) {
          const msg = msgs?.[0];
          if (msg) setError(key as keyof InstitutionalProjectFormFields, { message: msg });
        }
      }
      toast.error(r.message);
      return;
    }

    toast.success(mode === "create" ? "Proyecto creado" : "Cambios guardados");
    router.push(mode === "create" ? "/proyecto" : `/proyecto/${projectId}`);
    router.refresh();
  }

  const showCompany = viewerRole === "SUPER_ADMIN" && mode === "create";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      {showCompany ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Empresa</CardTitle>
            <CardDescription>El proyecto queda vinculado a la empresa seleccionada.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="proj-company">Organización</Label>
              <select
                id="proj-company"
                className="flex h-8 w-full max-w-md rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
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
          <CardTitle className="text-base">Identificación</CardTitle>
          <CardDescription>Nombre, año y metodología de trabajo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="proj-title">Nombre</Label>
            <Input
              id="proj-title"
              aria-invalid={!!errors.title}
              className={cn(errors.title && "border-destructive")}
              {...register("title")}
            />
            {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-year">Año</Label>
            <Input
              id="proj-year"
              type="number"
              min={1900}
              max={2100}
              placeholder="Ej. 2026"
              aria-invalid={!!errors.year}
              className={cn("tabular-nums", errors.year && "border-destructive")}
              {...register("year")}
            />
            {errors.year ? <p className="text-xs text-destructive">{errors.year.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-methodology">Metodología</Label>
            <Input
              id="proj-methodology"
              placeholder="OKR, BSC, etc."
              aria-invalid={!!errors.methodology}
              className={cn(errors.methodology && "border-destructive")}
              {...register("methodology")}
            />
            {errors.methodology ? <p className="text-xs text-destructive">{errors.methodology.message}</p> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="proj-status">Estado</Label>
            <select
              id="proj-status"
              className="flex h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              {...register("status")}
            >
              {(["DRAFT", "ACTIVE", "ARCHIVED"] as const).map((s) => (
                <option key={s} value={s}>
                  {institutionalProjectStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Contenido</CardTitle>
          <CardDescription>Descripción, misión y visión (opcionales).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proj-desc">Descripción</Label>
            <textarea
              id="proj-desc"
              rows={4}
              className={cn(
                "w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
                errors.description && "border-destructive"
              )}
              {...register("description")}
            />
            {errors.description ? <p className="text-xs text-destructive">{errors.description.message}</p> : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="proj-mission">Misión</Label>
              <textarea
                id="proj-mission"
                rows={3}
                className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                {...register("mission")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-vision">Visión</Label>
              <textarea
                id="proj-vision"
                rows={3}
                className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                {...register("vision")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {mode === "edit" || (mode === "create" && viewerRole === "ADMIN_EMPRESA") ? (
        <input type="hidden" {...register("companyId")} />
      ) : null}

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
            "Crear proyecto"
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </form>
  );
}
