"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import type { InstitutionalObjectiveStatus } from "@/generated/prisma";
import {
  createInstitutionalObjective,
  updateInstitutionalObjective,
} from "@/lib/institutional-objectives/actions";
import { institutionalObjectiveFormSchema } from "@/lib/institutional-objectives/schemas";
import { institutionalObjectiveStatusLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ProjectOption = { id: string; title: string; companyName: string };

export type InstitutionalObjectiveFormFields = {
  title: string;
  description: string;
  weight: string;
  sortOrder: string;
  institutionalProjectId: string;
  status: InstitutionalObjectiveStatus;
  includedInGeneralProgress: boolean;
};

type InstitutionalObjectiveFormProps = {
  mode: "create" | "edit";
  objectiveId?: string;
  viewerRole: "SUPER_ADMIN" | "ADMIN_EMPRESA";
  projects: ProjectOption[];
  defaultValues: InstitutionalObjectiveFormFields;
  cancelHref: string;
};

export function InstitutionalObjectiveForm({
  mode,
  objectiveId,
  viewerRole,
  projects,
  defaultValues,
  cancelHref,
}: InstitutionalObjectiveFormProps) {
  const router = useRouter();
  const resolver = useMemo(
    () =>
      zodResolver(institutionalObjectiveFormSchema) as unknown as Resolver<InstitutionalObjectiveFormFields>,
    []
  );

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InstitutionalObjectiveFormFields>({
    resolver,
    defaultValues,
    mode: "onTouched",
  });

  const includedInGeneralProgress = watch("includedInGeneralProgress");
  const weightLocked = !includedInGeneralProgress;

  async function onSubmit(values: InstitutionalObjectiveFormFields) {
    const r =
      mode === "create"
        ? await createInstitutionalObjective(values)
        : await updateInstitutionalObjective(objectiveId!, values);

    if (!r.ok) {
      if (r.fieldErrors) {
        for (const [key, msgs] of Object.entries(r.fieldErrors)) {
          const msg = msgs?.[0];
          if (msg) setError(key as keyof InstitutionalObjectiveFormFields, { message: msg });
        }
      }
      toast.error(r.message);
      return;
    }

    toast.success(mode === "create" ? "Objetivo creado" : "Cambios guardados");
    router.push(mode === "create" ? "/objetivos" : `/objetivos/${objectiveId}`);
    router.refresh();
  }

  const showProjectSelect = mode === "create";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      {showProjectSelect ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Proyecto institucional</CardTitle>
            <CardDescription>El objetivo queda ligado al proyecto y a la empresa correspondiente.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="io-project">Proyecto</Label>
              <select
                id="io-project"
                className="flex h-8 w-full max-w-xl rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                {...register("institutionalProjectId")}
              >
                <option value="">Seleccionar proyecto…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {viewerRole === "SUPER_ADMIN" ? `${p.title} · ${p.companyName}` : p.title}
                  </option>
                ))}
              </select>
              {errors.institutionalProjectId ? (
                <p className="text-xs text-destructive">{errors.institutionalProjectId.message}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : (
        <input type="hidden" {...register("institutionalProjectId")} />
      )}

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Definición</CardTitle>
          <CardDescription>Nombre, alcance del avance del proyecto, peso y orden.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="io-title">Nombre</Label>
            <Input
              id="io-title"
              aria-invalid={!!errors.title}
              className={cn(errors.title && "border-destructive")}
              {...register("title")}
            />
            {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
          </div>
          <div className="flex items-start gap-3 sm:col-span-2 rounded-lg border border-border/60 bg-muted/15 p-4">
            <input
              id="io-included-general"
              type="checkbox"
              className="mt-1 size-4 shrink-0 rounded border-input accent-primary"
              {...register("includedInGeneralProgress")}
            />
            <div className="min-w-0 space-y-1">
              <Label htmlFor="io-included-general" className="cursor-pointer text-sm font-medium leading-snug">
                Incluir en el avance general del proyecto
              </Label>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Si lo desmarcás, el objetivo queda solo para seguimiento: su avance y el de lo que cuelga de él se
                calculan igual, pero no modifican el porcentaje global del proyecto ni los promedios de tableros y
                reportes consolidados.
              </p>
            </div>
          </div>
          <div
            className={cn(
              "space-y-2 rounded-lg border border-transparent p-1 transition-colors",
              weightLocked && "border-border/50 bg-muted/25 opacity-90"
            )}
          >
            <Label
              htmlFor="io-weight"
              className={cn(weightLocked && "text-muted-foreground")}
            >
              Peso (ponderación)
            </Label>
            <Input
              id="io-weight"
              type="number"
              step="any"
              min="0"
              readOnly={weightLocked}
              tabIndex={weightLocked ? -1 : undefined}
              aria-invalid={!!errors.weight}
              aria-describedby={
                [errors.weight ? "io-weight-err" : null, weightLocked ? "io-weight-scope-hint" : "io-weight-help"]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              className={cn(
                "tabular-nums transition-opacity",
                errors.weight && "border-destructive",
                weightLocked && "cursor-not-allowed bg-muted/40 text-muted-foreground opacity-80"
              )}
              {...register("weight")}
            />
            {errors.weight ? (
              <p id="io-weight-err" className="text-xs text-destructive">
                {errors.weight.message}
              </p>
            ) : null}
            {weightLocked ? (
              <p id="io-weight-scope-hint" className="text-xs font-medium text-muted-foreground">
                Este objetivo no impacta en el avance general. El peso se conserva por si volvés a incluirlo.
              </p>
            ) : (
              <p id="io-weight-help" className="text-xs text-muted-foreground">
                Usado al consolidar avances de objetivos clave hijos.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="io-sort">Orden</Label>
            <Input
              id="io-sort"
              type="number"
              min={0}
              aria-invalid={!!errors.sortOrder}
              className={cn("tabular-nums", errors.sortOrder && "border-destructive")}
              {...register("sortOrder")}
            />
            {errors.sortOrder ? <p className="text-xs text-destructive">{errors.sortOrder.message}</p> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="io-status">Estado</Label>
            <select
              id="io-status"
              className="flex h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              {...register("status")}
            >
              {(["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"] as const).map((s) => (
                <option key={s} value={s}>
                  {institutionalObjectiveStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="io-desc">Descripción</Label>
            <textarea
              id="io-desc"
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
            "Crear objetivo"
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </form>
  );
}
