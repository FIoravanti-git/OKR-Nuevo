"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import type { ActivityStatus } from "@/generated/prisma";
import { updateActivityProgressSnapshot } from "@/lib/activities/actions";
import { activityProgressFormSchema } from "@/lib/activities/schemas";
import { activityStatusLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ProgressFields = {
  status: ActivityStatus;
  progressInput: string;
  observation: string;
};

const STATUSES: ActivityStatus[] = ["PLANNED", "IN_PROGRESS", "DONE", "BLOCKED", "CANCELLED"];

type ActivityProgressPanelProps = {
  activityId: string;
  defaultStatus: ActivityStatus;
  defaultProgressInput: string;
  defaultObservation?: string;
  /** Predecesora no hecha: no se puede pasar a en progreso / hecha ni cargar avance &gt; 0. */
  blockedByDependency?: boolean;
};

export function ActivityProgressPanel({
  activityId,
  defaultStatus,
  defaultProgressInput,
  defaultObservation = "",
  blockedByDependency = false,
}: ActivityProgressPanelProps) {
  const router = useRouter();
  const resolver = useMemo(
    () => zodResolver(activityProgressFormSchema) as unknown as Resolver<ProgressFields>,
    []
  );

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProgressFields>({
    resolver,
    defaultValues: {
      status: defaultStatus,
      progressInput: defaultProgressInput,
      observation: defaultObservation,
    },
    mode: "onTouched",
  });
  const statusValue = useWatch({ control, name: "status" });
  const progressValue = useWatch({ control, name: "progressInput" });
  const progressText = progressValue ?? "";

  async function onSubmit(values: ProgressFields) {
    const r = await updateActivityProgressSnapshot(activityId, values);
    if (!r.ok) {
      if (r.fieldErrors) {
        for (const [key, msgs] of Object.entries(r.fieldErrors)) {
          const msg = msgs?.[0];
          if (msg) setError(key as keyof ProgressFields, { message: msg });
        }
      }
      if (r.message === "No hay cambios para guardar") {
        toast.info("No hay cambios para guardar");
      } else {
        toast.error("No se pudo guardar el seguimiento. Intenta de nuevo");
      }
      return;
    }
    toast.success("Seguimiento actualizado correctamente");
    router.refresh();
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="size-4 text-primary" />
          Seguimiento de avance
        </CardTitle>
        <CardDescription>
          Disponible para administradores y para operadores asignados (o sin responsable). Registra historial y
          recalcula el resultado clave cuando corresponde.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {blockedByDependency ? (
          <p className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
            Esta tarea está bloqueada por una dependencia: la otra actividad tiene que estar hecha antes de poder
            registrar avance o pasar a En progreso / Hecha.
          </p>
        ) : null}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="snap-status">Estado</Label>
            <select
              id="snap-status"
              className="flex h-9 min-w-[180px] rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
              {...register("status")}
            >
              {STATUSES.map((s) => (
                <option
                  key={s}
                  value={s}
                  disabled={blockedByDependency && (s === "IN_PROGRESS" || s === "DONE")}
                >
                  {activityStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="snap-p">Avance %</Label>
            <Input
              id="snap-p"
              inputMode="decimal"
              placeholder={statusValue === "PLANNED" ? "0" : statusValue === "DONE" ? "100 (auto)" : "Vacío = limpiar"}
              disabled={statusValue === "DONE"}
              className={cn("h-9 w-32 tabular-nums", errors.progressInput && "border-destructive")}
              {...register("progressInput")}
            />
            {errors.progressInput ? (
              <p className="text-xs text-destructive">{errors.progressInput.message}</p>
            ) : null}
            {statusValue === "PLANNED" && progressText.trim() !== "" && Number(progressText.replace(",", ".")) !== 0 ? (
              <p className="text-xs text-amber-600">Planificada solo admite avance 0.</p>
            ) : null}
            {statusValue === "DONE" ? (
              <p className="text-xs text-muted-foreground">Hecha fuerza avance 100 automáticamente.</p>
            ) : null}
          </div>
          <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Registrar
          </Button>
          </div>
          <div className="space-y-2 max-w-xl">
            <Label htmlFor="snap-obs">Observación (opcional)</Label>
            <textarea
              id="snap-obs"
              rows={2}
              placeholder="Contexto del cambio para el historial…"
              className={cn(
                "w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30",
                errors.observation && "border-destructive"
              )}
              {...register("observation")}
            />
            {errors.observation ? (
              <p className="text-xs text-destructive">{errors.observation.message}</p>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
