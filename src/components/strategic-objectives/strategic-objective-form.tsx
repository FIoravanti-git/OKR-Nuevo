"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import type { StrategicObjectiveStatus } from "@/generated/prisma";
import { createStrategicObjective, updateStrategicObjective } from "@/lib/strategic-objectives/actions";
import { strategicObjectiveFormSchema } from "@/lib/strategic-objectives/schemas";
import { strategicObjectiveStatusLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type InstitutionalObjectiveOption = {
  id: string;
  title: string;
  projectTitle: string;
  companyName: string;
  companyId: string;
};

export type AreaOption = {
  id: string;
  name: string;
  companyId: string;
};

export type StrategicObjectiveFormFields = {
  title: string;
  description: string;
  weight: string;
  sortOrder: string;
  institutionalObjectiveId: string;
  status: StrategicObjectiveStatus;
  areaId: string;
};

type StrategicObjectiveFormProps = {
  mode: "create" | "edit";
  strategicId?: string;
  viewerRole: "SUPER_ADMIN" | "ADMIN_EMPRESA";
  institutionalObjectives: InstitutionalObjectiveOption[];
  areaOptions: AreaOption[];
  defaultValues: StrategicObjectiveFormFields;
  cancelHref: string;
};

const STATUS_ORDER = ["DRAFT", "ACTIVE", "AT_RISK", "COMPLETED", "CANCELLED"] as const;

export function StrategicObjectiveForm({
  mode,
  strategicId,
  viewerRole,
  institutionalObjectives,
  areaOptions,
  defaultValues,
  cancelHref,
}: StrategicObjectiveFormProps) {
  const router = useRouter();
  const resolver = useMemo(
    () => zodResolver(strategicObjectiveFormSchema) as unknown as Resolver<StrategicObjectiveFormFields>,
    []
  );

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<StrategicObjectiveFormFields>({
    resolver,
    defaultValues,
    mode: "onTouched",
  });

  const institutionalObjectiveId = useWatch({ control, name: "institutionalObjectiveId" });
  const selectedIo = institutionalObjectives.find((o) => o.id === institutionalObjectiveId);
  const companyIdForArea =
    mode === "edit" ? institutionalObjectives[0]?.companyId ?? null : selectedIo?.companyId ?? null;
  const filteredAreas = useMemo(
    () => (companyIdForArea ? areaOptions.filter((a) => a.companyId === companyIdForArea) : []),
    [areaOptions, companyIdForArea]
  );

  async function onSubmit(values: StrategicObjectiveFormFields) {
    const r =
      mode === "create"
        ? await createStrategicObjective(values)
        : await updateStrategicObjective(strategicId!, values);

    if (!r.ok) {
      if (r.fieldErrors) {
        for (const [key, msgs] of Object.entries(r.fieldErrors)) {
          const msg = msgs?.[0];
          if (msg) setError(key as keyof StrategicObjectiveFormFields, { message: msg });
        }
      }
      toast.error(r.message);
      return;
    }

    toast.success(mode === "create" ? "Objetivo clave creado" : "Cambios guardados");
    router.push(mode === "create" ? "/objetivos-clave" : `/objetivos-clave/${strategicId}`);
    router.refresh();
  }

  const showParentSelect = mode === "create";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      {showParentSelect ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Jerarquía OKR</CardTitle>
            <CardDescription>
              El objetivo clave queda bajo un objetivo institucional y la empresa se asigna automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="so-parent">Objetivo institucional</Label>
              <select
                id="so-parent"
                className="flex h-8 w-full max-w-xl rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                {...register("institutionalObjectiveId")}
              >
                <option value="">Seleccionar objetivo institucional…</option>
                {institutionalObjectives.map((o) => (
                  <option key={o.id} value={o.id}>
                    {viewerRole === "SUPER_ADMIN"
                      ? `${o.projectTitle} › ${o.title} · ${o.companyName}`
                      : `${o.projectTitle} › ${o.title}`}
                  </option>
                ))}
              </select>
              {errors.institutionalObjectiveId ? (
                <p className="text-xs text-destructive">{errors.institutionalObjectiveId.message}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : (
        <input type="hidden" {...register("institutionalObjectiveId")} />
      )}

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Definición</CardTitle>
          <CardDescription>Nombre, descripción, ponderación y estado.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="so-title">Nombre</Label>
            <Input
              id="so-title"
              aria-invalid={!!errors.title}
              className={cn(errors.title && "border-destructive")}
              {...register("title")}
            />
            {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="so-weight">Peso (ponderación)</Label>
            <Input
              id="so-weight"
              type="number"
              step="any"
              min="0"
              aria-invalid={!!errors.weight}
              className={cn("tabular-nums", errors.weight && "border-destructive")}
              {...register("weight")}
            />
            {errors.weight ? <p className="text-xs text-destructive">{errors.weight.message}</p> : null}
            <p className="text-xs text-muted-foreground">
              Usado al consolidar avances de resultados clave hijos hacia este objetivo.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="so-sort">Orden</Label>
            <Input
              id="so-sort"
              type="number"
              min={0}
              aria-invalid={!!errors.sortOrder}
              className={cn("tabular-nums", errors.sortOrder && "border-destructive")}
              {...register("sortOrder")}
            />
            {errors.sortOrder ? <p className="text-xs text-destructive">{errors.sortOrder.message}</p> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="so-status">Estado</Label>
            <select
              id="so-status"
              className="flex h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              {...register("status")}
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {strategicObjectiveStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="so-area">Área</Label>
            <select
              id="so-area"
              disabled={!companyIdForArea}
              className="flex h-8 w-full max-w-xl rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 dark:bg-input/30"
              {...register("areaId")}
            >
              <option value="">Seleccionar área…</option>
              {filteredAreas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            {mode === "create" && !companyIdForArea ? (
              <p className="text-xs text-muted-foreground">Elegí primero el objetivo institucional para listar áreas.</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Los responsables del objetivo se toman del equipo del área (roles definidos en Organización).
            </p>
            {errors.areaId ? <p className="text-xs text-destructive">{errors.areaId.message}</p> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="so-desc">Descripción</Label>
            <textarea
              id="so-desc"
              rows={4}
              className={cn(
                "w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
                errors.description && "border-destructive"
              )}
              {...register("description")}
            />
            {errors.description ? <p className="text-xs text-destructive">{errors.description.message}</p> : null}
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
            "Crear objetivo clave"
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </form>
  );
}
