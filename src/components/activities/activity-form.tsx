"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import type { ActivityStatus } from "@/generated/prisma";
import { createActivity, updateActivity } from "@/lib/activities/actions";
import { activityFormSchema } from "@/lib/activities/schemas";
import { activityStatusLabel } from "@/lib/format";
import type {
  ActivityDependencyOption,
  AssignableUserOption,
  KeyResultOptionForActivity,
} from "@/types/activity-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateInputDdMmYyyy } from "@/components/ui/date-input-ddmmyyyy";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TypeaheadSelect } from "@/components/ui/typeahead-select";
import { cn } from "@/lib/utils";
import { keyResultUsesWeightedActivityAggregation } from "@/lib/okr/key-result-activity-aggregation";
import { plannedStartPassedWhileBlocked } from "@/lib/activities/dependency";

export type ActivityFormFields = {
  title: string;
  description: string;
  keyResultId: string;
  assigneeUserId: string;
  startDate: string;
  dueDate: string;
  status: ActivityStatus;
  impactsProgress: boolean;
  contributionWeight: string;
  progressContributionStr: string;
  dependsOnActivityId: string;
  observation: string;
};

const STATUSES: ActivityStatus[] = ["PLANNED", "IN_PROGRESS", "DONE", "BLOCKED", "CANCELLED"];

type ActivityFormProps = {
  mode: "create" | "edit";
  activityId?: string;
  keyResults: KeyResultOptionForActivity[];
  users: AssignableUserOption[];
  /** En edición, empresa del KR para listar responsables sin depender del watch. */
  assigneeCompanyId?: string;
  dependencyOptions: ActivityDependencyOption[];
  /** Excluir la actividad actual del listado de predecesoras (edición). */
  currentActivityId?: string;
  /** Texto ya formateado del inicio real, si existe (edición). */
  initialActualStartLabel?: string | null;
  /** Texto ya formateado del fin real, si existe (edición). */
  initialActualEndLabel?: string | null;
  /** Calculado en servidor: inicio real posterior al inicio planificado. */
  delayedStartVsPlannedHint?: boolean;
  defaultValues: ActivityFormFields;
  cancelHref: string;
};

export function ActivityForm({
  mode,
  activityId,
  keyResults,
  users,
  assigneeCompanyId,
  dependencyOptions,
  currentActivityId,
  initialActualStartLabel,
  initialActualEndLabel,
  delayedStartVsPlannedHint,
  defaultValues,
  cancelHref,
}: ActivityFormProps) {
  const router = useRouter();
  const resolver = useMemo(
    () => zodResolver(activityFormSchema) as unknown as Resolver<ActivityFormFields>,
    []
  );

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormFields>({
    resolver,
    defaultValues,
    mode: "onTouched",
  });

  const keyResultId = useWatch({ control, name: "keyResultId" });
  const startDate = useWatch({ control, name: "startDate" });
  const dueDate = useWatch({ control, name: "dueDate" });
  const impactsProgress = useWatch({ control, name: "impactsProgress" });
  const contributionWeightWatch = useWatch({ control, name: "contributionWeight" });
  const dependsOnActivityIdWatch = useWatch({ control, name: "dependsOnActivityId" });
  const selectedKr = keyResults.find((k) => k.id === keyResultId);

  const dependencyPickList = useMemo(
    () => dependencyOptions.filter((o) => o.id !== currentActivityId),
    [dependencyOptions, currentActivityId]
  );
  const selectedPredecessor = useMemo(() => {
    const id = (dependsOnActivityIdWatch ?? "").trim();
    if (!id) return null;
    return dependencyPickList.find((o) => o.id === id) ?? null;
  }, [dependencyPickList, dependsOnActivityIdWatch]);
  const blockedByDependencyForm = Boolean(selectedPredecessor && selectedPredecessor.status !== "DONE");

  const plannedStartAsDate = useMemo(() => {
    const t = (startDate ?? "").trim();
    if (!t) return null;
    const [y, m, d] = t.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  }, [startDate]);
  const startAtRisk = useMemo(
    () =>
      plannedStartPassedWhileBlocked({
        startDate: plannedStartAsDate,
        dependsOnActivityId: (dependsOnActivityIdWatch ?? "").trim() || null,
        predecessorStatus: selectedPredecessor?.status ?? null,
      }),
    [plannedStartAsDate, dependsOnActivityIdWatch, selectedPredecessor?.status]
  );

  const showPesoImpacto =
    impactsProgress === true &&
    Boolean(selectedKr?.allowActivityImpact) &&
    Boolean(selectedKr && keyResultUsesWeightedActivityAggregation(selectedKr.progressMode));

  useEffect(() => {
    if (selectedKr && !selectedKr.allowActivityImpact) {
      setValue("impactsProgress", false, { shouldValidate: true });
    }
  }, [selectedKr?.id, selectedKr?.allowActivityImpact, setValue]);

  /** Si el indicador agrega con máx./mín. (no ponderado), el peso no se edita pero Zod exige un valor > 0 cuando impacta. */
  useEffect(() => {
    if (!impactsProgress || !selectedKr?.allowActivityImpact) return;
    if (keyResultUsesWeightedActivityAggregation(selectedKr.progressMode)) return;
    const cur = (getValues("contributionWeight") ?? "").trim();
    if (cur === "") setValue("contributionWeight", "1", { shouldValidate: true });
  }, [
    impactsProgress,
    selectedKr?.id,
    selectedKr?.allowActivityImpact,
    selectedKr?.progressMode,
    setValue,
    getValues,
  ]);

  /** Si la tarea no impacta el indicador, el peso no aplica: limpiar el campo en pantalla. */
  useEffect(() => {
    if (impactsProgress) return;
    setValue("contributionWeight", "", { shouldValidate: true });
  }, [impactsProgress, setValue]);

  const projectedImpactWeightsSum = useMemo(() => {
    if (!selectedKr || !showPesoImpacto) return null;
    const t = (contributionWeightWatch ?? "").trim().replace(",", ".");
    const n = Number(t);
    const w = Number.isFinite(n) ? n : 0;
    return selectedKr.otherImpactingWeightsSum + w;
  }, [selectedKr, showPesoImpacto, contributionWeightWatch]);

  const weightSumMismatch =
    projectedImpactWeightsSum != null && Math.abs(projectedImpactWeightsSum - 100) > 0.01;
  const companyIdForAssignee =
    mode === "edit" && assigneeCompanyId ? assigneeCompanyId : selectedKr?.companyId ?? null;
  const effectiveAreaId = selectedKr
    ? selectedKr.keyResultAreaId ?? selectedKr.strategicObjectiveAreaId ?? null
    : null;

  const assigneeOptions = useMemo(() => {
    if (!companyIdForAssignee) return [];
    let list = users.filter((u) => u.companyId === companyIdForAssignee);
    if (effectiveAreaId) {
      list = list.filter((u) => u.membershipAreaIds.includes(effectiveAreaId));
    }
    return list;
  }, [users, companyIdForAssignee, effectiveAreaId]);

  const keyResultSelectOptions = useMemo(
    () =>
      keyResults.map((k) => ({
        value: k.id,
        label: `${k.projectTitle} › ${k.institutionalObjectiveTitle} › ${k.strategicObjectiveTitle} › ${k.title}`,
        keywords: `${k.projectTitle} ${k.institutionalObjectiveTitle} ${k.strategicObjectiveTitle} ${k.title}`,
      })),
    [keyResults]
  );

  async function onSubmit(values: ActivityFormFields) {
    const payload = {
      ...values,
      impactsProgress: values.impactsProgress === true,
    };
    const r =
      mode === "create" ? await createActivity(payload) : await updateActivity(activityId!, payload);

    if (!r.ok) {
      if (r.fieldErrors) {
        for (const [key, msgs] of Object.entries(r.fieldErrors)) {
          const msg = msgs?.[0];
          if (msg) setError(key as keyof ActivityFormFields, { message: msg });
        }
      }
      toast.error(r.message);
      return;
    }

    toast.success(mode === "create" ? "Actividad creada" : "Cambios guardados");
    router.push(mode === "create" ? "/actividades" : `/actividades/${activityId}`);
    router.refresh();
  }

  const showKrSelect = mode === "create";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      {showKrSelect ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Resultado clave</CardTitle>
            <CardDescription>
              La empresa se define según el resultado clave. Elegí el resultado: el listado de responsables incluye
              solo a quienes pertenecen al área vinculada a ese indicador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="act-kr">Resultado clave</Label>
              <TypeaheadSelect
                id="act-kr"
                value={keyResultId ?? ""}
                onValueChange={(value) =>
                  setValue("keyResultId", value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
                }
                options={keyResultSelectOptions}
                placeholder="Seleccionar…"
                emptyText="Sin coincidencias"
                ariaInvalid={!!errors.keyResultId}
              />
              <input type="hidden" {...register("keyResultId")} />
              {errors.keyResultId ? (
                <p className="text-xs text-destructive">{errors.keyResultId.message}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : (
        <input type="hidden" {...register("keyResultId")} />
      )}

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Tarea</CardTitle>
          <CardDescription>Título, descripción, fechas y estado.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="act-title">Título</Label>
            <Input
              id="act-title"
              aria-invalid={!!errors.title}
              className={cn(errors.title && "border-destructive")}
              {...register("title")}
            />
            {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="act-start">Fecha inicio</Label>
            <DateInputDdMmYyyy
              id="act-start"
              valueYmd={startDate ?? ""}
              onChangeYmd={(v) => setValue("startDate", v, { shouldDirty: true, shouldTouch: true })}
              className="tabular-nums"
            />
            <input type="hidden" {...register("startDate")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="act-due">Fecha vencimiento</Label>
            <DateInputDdMmYyyy
              id="act-due"
              valueYmd={dueDate ?? ""}
              onChangeYmd={(v) => setValue("dueDate", v, { shouldDirty: true, shouldTouch: true })}
              className="tabular-nums"
            />
            <input type="hidden" {...register("dueDate")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="act-assignee">Responsable</Label>
            <select
              id="act-assignee"
              disabled={mode === "create" && !keyResultId}
              className="flex h-8 w-full max-w-xl rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 dark:bg-input/30"
              {...register("assigneeUserId")}
            >
              <option value="">Sin asignar</option>
              {assigneeOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            {mode === "create" && !keyResultId ? (
              <p className="text-xs text-muted-foreground">Elegí un resultado clave para listar responsables.</p>
            ) : null}
            {mode === "create" && keyResultId && effectiveAreaId && assigneeOptions.length === 0 ? (
              <p className="text-xs text-amber-800 dark:text-amber-200">
                No hay personas activas en ese equipo. Sumalas desde Áreas o dejá la tarea sin responsable.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="act-status">Estado</Label>
            <select
              id="act-status"
              className="flex h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              {...register("status")}
            >
              {STATUSES.map((s) => (
                <option
                  key={s}
                  value={s}
                  disabled={blockedByDependencyForm && (s === "IN_PROGRESS" || s === "DONE")}
                >
                  {activityStatusLabel(s)}
                </option>
              ))}
            </select>
            {blockedByDependencyForm ? (
              <p className="text-xs text-amber-800 dark:text-amber-200">
                La predecesora no está hecha: no podés pasar a En progreso ni Hecha hasta que se cumpla la dependencia.
              </p>
            ) : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="act-desc">Descripción</Label>
            <textarea
              id="act-desc"
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
          <CardTitle className="text-base">Dependencia entre tareas</CardTitle>
          <CardDescription>
            Fin → inicio: esta tarea no puede estar en progreso ni registrar avance hasta que la otra esté hecha. Las
            fechas de planificación no se mueven solas; si perdés tiempo esperando, se muestra como riesgo o atraso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="act-depends-on">Depende de otra actividad</Label>
            <select
              id="act-depends-on"
              className="flex h-8 w-full max-w-2xl rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              {...register("dependsOnActivityId")}
            >
              <option value="">Sin dependencia</option>
              {dependencyPickList.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.keyResultTitle} · {o.title} ({activityStatusLabel(o.status)})
                </option>
              ))}
            </select>
            {errors.dependsOnActivityId ? (
              <p className="text-xs text-destructive">{errors.dependsOnActivityId.message}</p>
            ) : null}
          </div>
          {selectedPredecessor ? (
            <div className="rounded-lg border border-border/60 bg-muted/15 px-3 py-3 text-sm space-y-2">
              <p className="text-muted-foreground">Predecesora</p>
              <p className="font-medium">
                {selectedPredecessor.keyResultTitle} · {selectedPredecessor.title}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {selectedPredecessor.status === "DONE" ? (
                  <Badge className="font-normal text-xs">Dependencia cumplida</Badge>
                ) : (
                  <Badge variant="secondary" className="font-normal text-xs">
                    Dependencia pendiente
                  </Badge>
                )}
                {blockedByDependencyForm ? (
                  <Badge variant="outline" className="border-amber-500/40 font-normal text-xs text-amber-950 dark:text-amber-100">
                    Bloqueada por dependencia
                  </Badge>
                ) : null}
              </div>
            </div>
          ) : null}
          {initialActualStartLabel ? (
            <div>
              <p className="text-xs text-muted-foreground">Inicio real (registrado al poder ejecutar)</p>
              <p className="font-medium tabular-nums">{initialActualStartLabel}</p>
            </div>
          ) : null}
          {initialActualEndLabel ? (
            <div>
              <p className="text-xs text-muted-foreground">Fin real</p>
              <p className="font-medium tabular-nums">{initialActualEndLabel}</p>
            </div>
          ) : null}
          {startAtRisk ? (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
              El inicio planificado ya pasó y la tarea sigue esperando la predecesora: hay riesgo de atraso respecto del
              plan (no replanificamos fechas automáticamente).
            </p>
          ) : null}
          {delayedStartVsPlannedHint ? (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
              El inicio real fue después del inicio planificado: se perdió tiempo respecto del calendario original
              (p. ej. por esperar la dependencia).
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Impacto en el indicador</CardTitle>
          <CardDescription>
            Marcá si esta tarea suma al avance del resultado clave y, cuando corresponde, el peso respecto de otras
            tareas. El porcentaje de avance es 0–100; vacío = sin dato cargado.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <label
            className={cn(
              "flex items-start gap-3 rounded-lg border border-border/60 bg-muted/10 px-3 py-3 sm:col-span-2",
              selectedKr && !selectedKr.allowActivityImpact ? "opacity-80" : "cursor-pointer"
            )}
          >
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-input"
              disabled={Boolean(selectedKr && !selectedKr.allowActivityImpact)}
              {...register("impactsProgress")}
            />
            <span>
              <span className="font-medium text-foreground">Impacta el resultado clave</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {selectedKr && !selectedKr.allowActivityImpact ? (
                  <>Este indicador no incorpora tareas en su avance; la opción no aplica.</>
                ) : (
                  <>
                    Si está desmarcado, el avance de la tarea no entra en el cálculo del indicador y el peso no se usa.
                  </>
                )}
              </span>
            </span>
          </label>
          {showPesoImpacto ? (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="act-weight">Peso de impacto</Label>
              <Input
                id="act-weight"
                type="number"
                step="any"
                min="0"
                className={cn("max-w-xs tabular-nums", errors.contributionWeight && "border-destructive")}
                {...register("contributionWeight")}
              />
              {errors.contributionWeight ? (
                <p className="text-xs text-destructive">{errors.contributionWeight.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Obligatorio si la tarea impacta el indicador. Se usa en el promedio ponderado junto con otras tareas
                  que también impactan.
                </p>
              )}
            </div>
          ) : null}
          {weightSumMismatch && projectedImpactWeightsSum != null ? (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100 sm:col-span-2">
              Los pesos de las tareas que impactan este indicador suman{" "}
              {Number.isInteger(projectedImpactWeightsSum)
                ? String(projectedImpactWeightsSum)
                : projectedImpactWeightsSum.toFixed(1).replace(/\.0$/, "")}{" "}
              (como referencia suele usarse 100). Revisá también las demás tareas del mismo indicador.
            </p>
          ) : null}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="act-progress">Porcentaje de avance</Label>
            <Input
              id="act-progress"
              inputMode="decimal"
              placeholder="Vacío = sin dato"
              className={cn("max-w-xs tabular-nums", errors.progressContributionStr && "border-destructive")}
              {...register("progressContributionStr")}
            />
            {errors.progressContributionStr ? (
              <p className="text-xs text-destructive">{errors.progressContributionStr.message}</p>
            ) : blockedByDependencyForm ? (
              <p className="text-xs text-amber-800 dark:text-amber-200">
                No podés cargar avance hasta que la predecesora esté hecha.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Historial</CardTitle>
          <CardDescription>
            Si cambiás el avance o el estado, podés dejar una observación (se guarda solo cuando hay cambio
            registrado).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-2xl">
            <Label htmlFor="act-obs">Observación opcional</Label>
            <textarea
              id="act-obs"
              rows={2}
              placeholder="Ej. acuerdo con el equipo, bloqueo resuelto…"
              className={cn(
                "w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
                errors.observation && "border-destructive"
              )}
              {...register("observation")}
            />
            {errors.observation ? <p className="text-xs text-destructive">{errors.observation.message}</p> : null}
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
            "Crear actividad"
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </form>
  );
}
