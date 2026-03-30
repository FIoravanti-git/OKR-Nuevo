"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import type { KeyResultCalculationMode } from "@/generated/prisma";
import { updateKeyResultManualProgressSnapshot } from "@/lib/key-results/actions";
import { keyResultManualProgressSchema } from "@/lib/key-results/schemas";
import { keyResultCalculationModeLabel } from "@/lib/format";
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
  progressInput: string;
  observation: string;
};

type KeyResultQuickProgressModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyResultId: string;
  keyResultTitle: string;
  calculationMode: KeyResultCalculationMode;
  currentProgress: number | null;
};

function parseProgress(raw: string): number | null {
  const n = Number(raw.trim().replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Number(n.toFixed(2));
}

export function KeyResultQuickProgressModal({
  open,
  onOpenChange,
  keyResultId,
  keyResultTitle,
  calculationMode,
  currentProgress,
}: KeyResultQuickProgressModalProps) {
  const router = useRouter();
  const resolver = useMemo(
    () => zodResolver(keyResultManualProgressSchema) as unknown as Resolver<FormValues>,
    []
  );
  const isManual = calculationMode === "MANUAL";

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
      progressInput: currentProgress != null ? String(Number(currentProgress.toFixed(2))) : "0",
      observation: "",
    },
    mode: "onTouched",
  });

  const progressInput = useWatch({ control, name: "progressInput" }) ?? "0";
  const parsed = parseProgress(progressInput);
  const sliderValue = parsed == null ? 0 : Math.min(100, Math.max(0, parsed));

  useEffect(() => {
    if (!open) return;
    reset({
      progressInput: currentProgress != null ? String(Number(currentProgress.toFixed(2))) : "0",
      observation: "",
    });
  }, [open, currentProgress, reset]);

  async function onSubmit(values: FormValues) {
    const next = parseProgress(values.progressInput);
    const prev = currentProgress != null ? Number(currentProgress.toFixed(2)) : null;
    if (next == null || next === prev) {
      toast.info("No hay cambios para guardar");
      return;
    }

    const r = await updateKeyResultManualProgressSnapshot(keyResultId, values);
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
            {keyResultTitle} · Registro rápido desde grilla.
          </SheetDescription>
        </SheetHeader>

        {!isManual ? (
          <div className="mx-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100">
            <p className="flex items-center gap-2 font-medium">
              <Info className="size-4" />
              Acción no disponible para este KR
            </p>
            <p className="mt-1 text-xs leading-relaxed">
              Modo actual: {keyResultCalculationModeLabel(calculationMode)}. El avance se calcula automáticamente.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
            <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`kr-quick-slider-${keyResultId}`}>Progreso (%)</Label>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary">
                  {sliderValue.toFixed(0)}%
                </span>
              </div>
              <input
                id={`kr-quick-slider-${keyResultId}`}
                type="range"
                min={0}
                max={100}
                step={1}
                value={sliderValue}
                onChange={(e) => setValue("progressInput", String(Number(e.target.value)), { shouldValidate: true })}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
              />
              <div className="flex items-center gap-2">
                <Input
                  inputMode="decimal"
                  placeholder="0 - 100"
                  value={progressInput}
                  onChange={(e) => setValue("progressInput", e.target.value, { shouldValidate: true })}
                  className={cn("h-9 w-28 tabular-nums", errors.progressInput && "border-destructive")}
                />
                <span className="text-xs text-muted-foreground">Ingreso manual</span>
              </div>
              {errors.progressInput ? (
                <p className="text-xs text-destructive">{errors.progressInput.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`kr-quick-note-${keyResultId}`}>Observación (opcional)</Label>
              <textarea
                id={`kr-quick-note-${keyResultId}`}
                rows={3}
                placeholder="Contexto del ajuste para historial..."
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
        )}
      </SheetContent>
    </Sheet>
  );
}
