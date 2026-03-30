"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import type { ActivityStatus } from "@/generated/prisma";
import { createActivity, updateActivity } from "@/lib/activities/actions";
import { activityFormSchema } from "@/lib/activities/schemas";
import { activityStatusLabel } from "@/lib/format";
import type { AssignableUserOption, KeyResultOptionForActivity } from "@/types/activity-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateInputDdMmYyyy } from "@/components/ui/date-input-ddmmyyyy";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
  defaultValues: ActivityFormFields;
  cancelHref: string;
};

export function ActivityForm({
  mode,
  activityId,
  keyResults,
  users,
  assigneeCompanyId,
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
  const selectedKr = keyResults.find((k) => k.id === keyResultId);
  const companyIdForAssignee =
    mode === "edit" && assigneeCompanyId ? assigneeCompanyId : selectedKr?.companyId ?? null;

  const assigneeOptions = useMemo(() => {
    if (!companyIdForAssignee) return [];
    return users.filter((u) => u.companyId === companyIdForAssignee);
  }, [users, companyIdForAssignee]);

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
              La actividad hereda empresa (`company_id`) del KR. Elegí primero el resultado para filtrar
              responsables.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="act-kr">Resultado clave</Label>
              <select
                id="act-kr"
                className="flex h-8 w-full max-w-2xl rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                {...register("keyResultId")}
              >
                <option value="">Seleccionar…</option>
                {keyResults.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.projectTitle} › {k.institutionalObjectiveTitle} › {k.strategicObjectiveTitle} › {k.title}
                  </option>
                ))}
              </select>
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
              <p className="text-xs text-muted-foreground">Elegí un resultado clave para listar usuarios de esa empresa.</p>
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
                <option key={s} value={s}>
                  {activityStatusLabel(s)}
                </option>
              ))}
            </select>
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
          <CardTitle className="text-base">Impacto en el resultado clave</CardTitle>
          <CardDescription>
            Ponderación para el motor de agregación del KR y porcentaje de avance de esta tarea (0–100). Vacío = sin
            porcentaje registrado.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="act-weight">Peso de impacto</Label>
            <Input
              id="act-weight"
              type="number"
              step="any"
              min="0"
              className={cn("tabular-nums", errors.contributionWeight && "border-destructive")}
              {...register("contributionWeight")}
            />
            {errors.contributionWeight ? (
              <p className="text-xs text-destructive">{errors.contributionWeight.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="act-progress">Porcentaje de avance</Label>
            <Input
              id="act-progress"
              inputMode="decimal"
              placeholder="Vacío = sin dato"
              className={cn("tabular-nums", errors.progressContributionStr && "border-destructive")}
              {...register("progressContributionStr")}
            />
            {errors.progressContributionStr ? (
              <p className="text-xs text-destructive">{errors.progressContributionStr.message}</p>
            ) : null}
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-muted/10 px-3 py-3 sm:col-span-2">
            <input type="checkbox" className="mt-0.5 size-4 rounded border-input" {...register("impactsProgress")} />
            <span>
              <span className="font-medium text-foreground">Impacta el resultado clave</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Si está desmarcado, el avance no entra en el cálculo del KR (queda listo para reglas futuras del
                motor).
              </span>
            </span>
          </label>
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
