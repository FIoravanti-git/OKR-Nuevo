"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import type { ActivityStatus } from "@/generated/prisma";
import { updateActivityProgressSnapshot } from "@/lib/activities/actions";
import { activityProgressFormSchema } from "@/lib/activities/schemas";
import { activityStatusLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type FormValues = {
  status: ActivityStatus;
  progressInput: string;
  observation: string;
};

const STATUSES: ActivityStatus[] = ["PLANNED", "IN_PROGRESS", "DONE", "BLOCKED", "CANCELLED"];

type ActivityQuickProgressModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityId: string;
  activityTitle: string;
  currentStatus: ActivityStatus;
  currentProgress: number | null;
};

function parseProgressOrNull(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? Number(n.toFixed(2)) : null;
}

export function ActivityQuickProgressModal({
  open,
  onOpenChange,
  activityId,
  activityTitle,
  currentStatus,
  currentProgress,
}: ActivityQuickProgressModalProps) {
  const router = useRouter();
  const resolver = useMemo(
    () => zodResolver(activityProgressFormSchema) as unknown as Resolver<FormValues>,
    []
  );

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver,
    defaultValues: {
      status: currentStatus,
      progressInput: currentProgress != null ? String(Number(currentProgress.toFixed(2))) : "",
      observation: "",
    },
    mode: "onTouched",
  });

  const statusValue = useWatch({ control, name: "status" });
  const progressInput = useWatch({ control, name: "progressInput" }) ?? "";

  const parsedProgress = parseProgressOrNull(progressInput);
  const sliderValue = parsedProgress == null ? 0 : Math.min(100, Math.max(0, parsedProgress));

  useEffect(() => {
    if (!open) return;
    reset({
      status: currentStatus,
      progressInput: currentProgress != null ? String(Number(currentProgress.toFixed(2))) : "",
      observation: "",
    });
  }, [open, currentStatus, currentProgress, reset]);

  function onStatusChange(next: ActivityStatus) {
    setValue("status", next, { shouldTouch: true, shouldValidate: true });
    if (next === "DONE") {
      setValue("progressInput", "100", { shouldTouch: true, shouldValidate: true });
      return;
    }
    if (next === "PLANNED") {
      setValue("progressInput", "0", { shouldTouch: true, shouldValidate: true });
    }
  }

  function onSliderChange(next: number) {
    setValue("progressInput", String(Math.min(100, Math.max(0, next))), {
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  async function onSubmit(values: FormValues) {
    const nextP = parseProgressOrNull(values.progressInput);
    const prevP = currentProgress != null ? Number(currentProgress.toFixed(2)) : null;
    if (values.status === currentStatus && nextP === prevP) {
      toast.info("No hay cambios para guardar");
      return;
    }

    const r = await updateActivityProgressSnapshot(activityId, values);
    if (!r.ok) {
      if (r.fieldErrors) {
        for (const [key, msgs] of Object.entries(r.fieldErrors)) {
          const msg = msgs?.[0];
          if (msg) setError(key as keyof FormValues, { message: msg });
        }
      }
      if (r.message === "No hay cambios para guardar") {
        toast.info("No hay cambios para guardar");
      } else {
        toast.error(r.message || "No se pudo registrar el avance");
      }
      return;
    }

    toast.success("Avance registrado");
    onOpenChange(false);
    reset({
      status: values.status,
      progressInput: values.progressInput,
      observation: "",
    });
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-primary" />
            Registrar avance
          </SheetTitle>
          <SheetDescription className="line-clamp-2">
            {activityTitle} · Actualizá avance y estado sin salir de la grilla.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor={`act-quick-status-${activityId}`}>Estado</Label>
            <select
              id={`act-quick-status-${activityId}`}
              value={statusValue}
              onChange={(e) => onStatusChange(e.target.value as ActivityStatus)}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {activityStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`act-quick-slider-${activityId}`}>Porcentaje avance</Label>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary">
                {sliderValue.toFixed(0)}%
              </span>
            </div>
            <input
              id={`act-quick-slider-${activityId}`}
              type="range"
              min={0}
              max={100}
              step={1}
              value={sliderValue}
              onChange={(e) => onSliderChange(Number(e.target.value))}
              disabled={statusValue === "DONE" || statusValue === "PLANNED"}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary disabled:cursor-not-allowed disabled:opacity-60"
            />
            <div className="flex items-center gap-2">
              <Input
                inputMode="decimal"
                placeholder="0 - 100"
                value={progressInput}
                disabled={statusValue === "DONE" || statusValue === "PLANNED"}
                onChange={(e) => setValue("progressInput", e.target.value, { shouldValidate: true })}
                className={cn("h-9 w-28 tabular-nums", errors.progressInput && "border-destructive")}
              />
              <span className="text-xs text-muted-foreground">Ingreso manual</span>
            </div>
            {errors.progressInput ? (
              <p className="text-xs text-destructive">{errors.progressInput.message}</p>
            ) : null}
            {statusValue === "DONE" ? (
              <p className="text-xs text-muted-foreground">Hecha fija avance en 100 automáticamente.</p>
            ) : null}
            {statusValue === "PLANNED" ? (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Planificada se guarda con avance 0 para mantener consistencia.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`act-quick-note-${activityId}`}>Observación (opcional)</Label>
            <textarea
              id={`act-quick-note-${activityId}`}
              rows={3}
              placeholder="Contexto del cambio para historial..."
              className={cn(
                "w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30",
                errors.observation && "border-destructive"
              )}
              {...register("observation")}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
              Guardar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
