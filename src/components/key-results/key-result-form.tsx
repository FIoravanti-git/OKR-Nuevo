"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import type {
  KeyResultCalculationMode,
  KeyResultMetricType,
  KeyResultStatus,
  KeyResultTargetDirection,
  ProgressCalculationMode,
} from "@/generated/prisma";
import { createKeyResult, updateKeyResult } from "@/lib/key-results/actions";
import { keyResultFormSchema } from "@/lib/key-results/schemas";
import {
  keyResultCalculationModeLabel,
  keyResultMetricTypeLabel,
  keyResultStatusLabel,
  keyResultTargetDirectionLabel,
  progressCalculationModeLabel,
} from "@/lib/format";
import { linearMetricProgress } from "@/lib/okr/metric-progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TypeaheadSelect } from "@/components/ui/typeahead-select";
import { cn } from "@/lib/utils";

export type StrategicObjectiveOption = {
  id: string;
  title: string;
  projectTitle: string;
  institutionalObjectiveTitle: string;
  companyName: string;
  companyId: string;
  areaId: string | null;
  areaName: string | null;
  /** Texto ya formateado para mostrar responsables del área. */
  areaResponsablesLabel: string;
};

export type KeyResultFormFields = {
  title: string;
  description: string;
  metricType: KeyResultMetricType;
  weight: string;
  sortOrder: string;
  strategicObjectiveId: string;
  status: KeyResultStatus;
  unit: string;
  initialValue: string;
  targetValue: string;
  currentValue: string;
  targetDirection: KeyResultTargetDirection;
  calculationMode: KeyResultCalculationMode;
  progressMode: ProgressCalculationMode;
  allowActivityImpact: boolean;
  manualProgress: string;
  progressChangeNote: string;
};

const METRIC_TYPES: KeyResultMetricType[] = ["NUMBER", "PERCENT", "CURRENCY", "COUNT", "CUSTOM"];
const CALC_MODES: KeyResultCalculationMode[] = ["MANUAL", "AUTOMATIC", "HYBRID"];
const PROGRESS_MODES: ProgressCalculationMode[] = [
  "WEIGHTED_AVERAGE",
  "SUM_NORMALIZED",
  "MAX_OF_CHILDREN",
  "MIN_OF_CHILDREN",
  "MANUAL_OVERRIDE",
];
const STATUSES: KeyResultStatus[] = ["DRAFT", "ON_TRACK", "AT_RISK", "COMPLETED", "CANCELLED"];
const TARGET_DIRECTIONS: KeyResultTargetDirection[] = ["ASCENDENTE", "DESCENDENTE"];

function parseOptNum(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

type KeyResultFormProps = {
  mode: "create" | "edit";
  keyResultId?: string;
  viewerRole: "SUPER_ADMIN" | "ADMIN_EMPRESA";
  strategicObjectives: StrategicObjectiveOption[];
  defaultValues: KeyResultFormFields;
  cancelHref: string;
};

export function KeyResultForm({
  mode,
  keyResultId,
  viewerRole,
  strategicObjectives,
  defaultValues,
  cancelHref,
}: KeyResultFormProps) {
  const router = useRouter();
  const resolver = useMemo(
    () => zodResolver(keyResultFormSchema) as unknown as Resolver<KeyResultFormFields>,
    []
  );

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<KeyResultFormFields>({
    resolver,
    defaultValues,
    mode: "onTouched",
  });

  const calculationMode = useWatch({ control, name: "calculationMode" });
  const strategicObjectiveId = useWatch({ control, name: "strategicObjectiveId" });
  const initialV = useWatch({ control, name: "initialValue" });
  const currentV = useWatch({ control, name: "currentValue" });
  const targetV = useWatch({ control, name: "targetValue" });
  const targetDirection = useWatch({ control, name: "targetDirection" });
  const strategicObjectiveOptions = useMemo(
    () =>
      strategicObjectives.map((s) => ({
        value: s.id,
        label:
          viewerRole === "SUPER_ADMIN"
            ? `${s.projectTitle} › ${s.institutionalObjectiveTitle} › ${s.title} · ${s.companyName}`
            : `${s.projectTitle} › ${s.institutionalObjectiveTitle} › ${s.title}`,
        keywords: `${s.projectTitle} ${s.institutionalObjectiveTitle} ${s.title} ${s.companyName}`,
      })),
    [strategicObjectives, viewerRole]
  );

  const selectedSo = strategicObjectives.find((s) => s.id === strategicObjectiveId);

  const previewLinear =
    calculationMode !== "MANUAL"
      ? linearMetricProgress(
          parseOptNum(initialV ?? ""),
          parseOptNum(currentV ?? ""),
          parseOptNum(targetV ?? ""),
          targetDirection
        )
      : null;

  async function onSubmit(values: KeyResultFormFields) {
    const payload = {
      ...values,
      allowActivityImpact: values.allowActivityImpact === true,
    };
    const r =
      mode === "create" ? await createKeyResult(payload) : await updateKeyResult(keyResultId!, payload);

    if (!r.ok) {
      if (r.fieldErrors) {
        for (const [key, msgs] of Object.entries(r.fieldErrors)) {
          const msg = msgs?.[0];
          if (msg) setError(key as keyof KeyResultFormFields, { message: msg });
        }
      }
      toast.error(r.message);
      return;
    }

    toast.success(mode === "create" ? "Resultado clave creado" : "Cambios guardados");
    router.push(mode === "create" ? "/resultados-clave" : `/resultados-clave/${keyResultId}`);
    router.refresh();
  }

  const showStrategicSelect = mode === "create";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      {showStrategicSelect ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Jerarquía</CardTitle>
            <CardDescription>
              La empresa y el área se toman del objetivo clave. Solo podés elegir objetivos que ya tengan área
              asignada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kr-strategic">Objetivo clave</Label>
              <TypeaheadSelect
                id="kr-strategic"
                value={strategicObjectiveId ?? ""}
                onValueChange={(value) =>
                  setValue("strategicObjectiveId", value, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                }
                options={strategicObjectiveOptions}
                placeholder="Seleccionar…"
                emptyText="Sin coincidencias"
                ariaInvalid={!!errors.strategicObjectiveId}
              />
              <input type="hidden" {...register("strategicObjectiveId")} />
              {errors.strategicObjectiveId ? (
                <p className="text-xs text-destructive">{errors.strategicObjectiveId.message}</p>
              ) : null}
            </div>
            {selectedSo?.areaId ? (
              <div className="rounded-lg border border-border/70 bg-muted/15 px-4 py-3 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Área</p>
                <p className="mt-1 font-medium text-foreground">{selectedSo.areaName ?? "—"}</p>
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Responsables</p>
                <p className="mt-1 text-foreground">
                  {selectedSo.areaResponsablesLabel.trim() ? selectedSo.areaResponsablesLabel : "Sin asignar"}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Se muestran automáticamente según el equipo del área. Para cambiarlos, editá el área en Organización.
                </p>
              </div>
            ) : selectedSo ? (
              <p className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
                Este objetivo clave no tiene área. Asignala en Objetivos clave antes de crear el resultado.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <>
          <input type="hidden" {...register("strategicObjectiveId")} />
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Jerarquía y área</CardTitle>
              <CardDescription>
                El área y los responsables coinciden con el objetivo clave padre (se actualizan al cambiar el área
                allí).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {strategicObjectives[0]?.areaId ? (
                <div className="rounded-lg border border-border/70 bg-muted/15 px-4 py-3 text-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Área</p>
                  <p className="mt-1 font-medium text-foreground">{strategicObjectives[0]?.areaName ?? "—"}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Responsables</p>
                  <p className="mt-1 text-foreground">
                    {strategicObjectives[0]?.areaResponsablesLabel?.trim()
                      ? strategicObjectives[0].areaResponsablesLabel
                      : "Sin asignar"}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-destructive">
                  El objetivo clave padre no tiene área. Asignala en Objetivos clave para poder guardar cambios
                  coherentes.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Definición</CardTitle>
          <CardDescription>Nombre, descripción, tipo de métrica y unidad.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="kr-title">Nombre</Label>
            <Input
              id="kr-title"
              aria-invalid={!!errors.title}
              className={cn(errors.title && "border-destructive")}
              {...register("title")}
            />
            {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="kr-metric">Tipo de métrica</Label>
            <select
              id="kr-metric"
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              {...register("metricType")}
            >
              {METRIC_TYPES.map((m) => (
                <option key={m} value={m}>
                  {keyResultMetricTypeLabel(m)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="kr-unit">Unidad (opcional)</Label>
            <Input
              id="kr-unit"
              placeholder="p. ej. USD, %, tickets"
              {...register("unit")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kr-weight">Peso (ponderación)</Label>
            <Input
              id="kr-weight"
              type="number"
              step="any"
              min="0"
              className={cn("tabular-nums", errors.weight && "border-destructive")}
              {...register("weight")}
            />
            {errors.weight ? <p className="text-xs text-destructive">{errors.weight.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="kr-sort">Orden</Label>
            <Input
              id="kr-sort"
              type="number"
              min={0}
              className={cn("tabular-nums", errors.sortOrder && "border-destructive")}
              {...register("sortOrder")}
            />
            {errors.sortOrder ? <p className="text-xs text-destructive">{errors.sortOrder.message}</p> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="kr-status">Estado</Label>
            <select
              id="kr-status"
              className="flex h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              {...register("status")}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {keyResultStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="kr-desc">Descripción</Label>
            <textarea
              id="kr-desc"
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

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Valores de la métrica</CardTitle>
          <CardDescription>Trayectoria inicial → meta y valor actual (para cálculo automático e híbrido).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="kr-initial">Valor inicial</Label>
            <Input
              id="kr-initial"
              inputMode="decimal"
              className="tabular-nums"
              placeholder="Vacío = 0 en el cálculo"
              {...register("initialValue")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kr-target">Valor meta</Label>
            <Input
              id="kr-target"
              inputMode="decimal"
              className="tabular-nums"
              {...register("targetValue")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kr-current">Valor actual</Label>
            <Input
              id="kr-current"
              inputMode="decimal"
              className="tabular-nums"
              {...register("currentValue")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kr-direction">Dirección de meta</Label>
            <select
              id="kr-direction"
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              {...register("targetDirection")}
            >
              {TARGET_DIRECTIONS.map((d) => (
                <option key={d} value={d}>
                  {keyResultTargetDirectionLabel(d)}
                </option>
              ))}
            </select>
          </div>
          {calculationMode !== "MANUAL" ? (
            <div className="sm:col-span-4 rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Progreso por métrica (calculado): </span>
              <span className="font-semibold tabular-nums text-foreground">
                {previewLinear == null ? "— (indicá meta y actual)" : `${previewLinear.toFixed(1)}%`}
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Cálculo de progreso</CardTitle>
          <CardDescription>
            Modo manual (0–100 explícito), automático desde métricas, o híbrido mezclando métricas con actividades que
            impacten este KR.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="kr-calc">Modo de cálculo</Label>
              <select
                id="kr-calc"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                {...register("calculationMode")}
              >
                {CALC_MODES.map((m) => (
                  <option key={m} value={m}>
                    {keyResultCalculationModeLabel(m)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kr-pmode">Agregación desde actividades</Label>
              <select
                id="kr-pmode"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                {...register("progressMode")}
              >
                {PROGRESS_MODES.map((m) => (
                  <option key={m} value={m}>
                    {progressCalculationModeLabel(m)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Aplica cuando las actividades tienen aporte de avance y el modo es automático (solo actividades) o
                híbrido.
              </p>
            </div>
          </div>

          {calculationMode === "MANUAL" ? (
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="kr-manual-p">Progreso (%)</Label>
              <Input
                id="kr-manual-p"
                type="number"
                min={0}
                max={100}
                step="0.1"
                className={cn("tabular-nums", errors.manualProgress && "border-destructive")}
                {...register("manualProgress")}
              />
              {errors.manualProgress ? (
                <p className="text-xs text-destructive">{errors.manualProgress.message}</p>
              ) : null}
            </div>
          ) : null}

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-muted/10 px-3 py-3 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 rounded border-input" {...register("allowActivityImpact")} />
            <span>
              <span className="font-medium text-foreground">Las actividades pueden impactar este resultado clave</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Si está desmarcado, el módulo de actividades no aportará al progreso de este KR (listo para reglas
                futuras). Las filas `Activity` ya tienen `impacts_progress` y `progress_contribution`.
              </span>
            </span>
          </label>
        </CardContent>
      </Card>

      {mode === "edit" ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Trazabilidad</CardTitle>
            <CardDescription>
              Observación opcional para el historial de avances del resultado clave (si hubo cambio de progreso,
              métrica o estado al guardar).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-2xl">
              <Label htmlFor="kr-progress-note">Observación del cambio</Label>
              <textarea
                id="kr-progress-note"
                rows={2}
                placeholder="Ej. actualización tras reunión de seguimiento…"
                className={cn(
                  "w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
                  errors.progressChangeNote && "border-destructive"
                )}
                {...register("progressChangeNote")}
              />
              {errors.progressChangeNote ? (
                <p className="text-xs text-destructive">{errors.progressChangeNote.message}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
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
            "Crear resultado clave"
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </form>
  );
}
