"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Gauge, Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import type { KeyResultMetricType, KeyResultStatus } from "@/generated/prisma";
import { updateKeyResultCurrentMetricSnapshot } from "@/lib/key-results/actions";
import { keyResultMetricCurrentValueQuickSchema } from "@/lib/key-results/schemas";
import { keyResultMetricTypeLabel } from "@/lib/format";
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
  currentValueInput: string;
  metricType: KeyResultMetricType;
  observation: string;
};

type KeyResultQuickCurrentValueModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyResultId: string;
  keyResultTitle: string;
  metricType: KeyResultMetricType;
  unit: string | null;
  initialValue: number | null;
  targetValue: number | null;
  currentValue: number | null;
  onSaved: (row: {
    currentValue: number | null;
    progressCached: number | null;
    status: KeyResultStatus;
  }) => void;
};

export function KeyResultQuickCurrentValueModal({
  open,
  onOpenChange,
  keyResultId,
  keyResultTitle,
  metricType,
  unit,
  initialValue,
  targetValue,
  currentValue,
  onSaved,
}: KeyResultQuickCurrentValueModalProps) {
  const resolver = useMemo(
    () => zodResolver(keyResultMetricCurrentValueQuickSchema) as unknown as Resolver<FormValues>,
    []
  );

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver,
    defaultValues: {
      currentValueInput: currentValue != null ? String(Number(currentValue.toFixed(6))) : "",
      metricType,
      observation: "",
    },
    mode: "onTouched",
  });

  useEffect(() => {
    if (!open) return;
    reset({
      currentValueInput: currentValue != null ? String(Number(currentValue.toFixed(6))) : "",
      metricType,
      observation: "",
    });
  }, [open, currentValue, metricType, reset]);

  async function onSubmit(values: FormValues) {
    const r = await updateKeyResultCurrentMetricSnapshot(keyResultId, values);
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
        toast.error(r.message || "No se pudo actualizar el valor actual");
      }
      return;
    }

    toast.success("Valor actual actualizado");
    onSaved({
      currentValue: r.row.currentValue,
      progressCached: r.row.progressCached,
      status: r.row.status,
    });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Gauge className="size-4 text-primary" />
            Actualizar valor actual
          </SheetTitle>
          <SheetDescription className="line-clamp-2">
            {keyResultTitle} · actualización rápida de métrica desde grilla.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              <span className="text-muted-foreground">Valor inicial</span>
              <span className="text-right font-medium tabular-nums">{initialValue ?? "—"}</span>
              <span className="text-muted-foreground">Valor meta</span>
              <span className="text-right font-medium tabular-nums">{targetValue ?? "—"}</span>
              <span className="text-muted-foreground">Unidad</span>
              <span className="text-right font-medium">{unit?.trim() ? unit : "—"}</span>
              <span className="text-muted-foreground">Tipo métrica</span>
              <span className="text-right font-medium">{keyResultMetricTypeLabel(metricType)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`kr-quick-current-${keyResultId}`}>Valor actual</Label>
            <Input
              id={`kr-quick-current-${keyResultId}`}
              inputMode="decimal"
              placeholder="Ej. 42.5"
              className={cn("tabular-nums", errors.currentValueInput && "border-destructive")}
              {...register("currentValueInput")}
            />
            {errors.currentValueInput ? (
              <p className="text-xs text-destructive">{errors.currentValueInput.message}</p>
            ) : null}
          </div>

          <input type="hidden" value={metricType} {...register("metricType")} />

          <div className="space-y-2">
            <Label htmlFor={`kr-quick-current-note-${keyResultId}`}>Observación (opcional)</Label>
            <textarea
              id={`kr-quick-current-note-${keyResultId}`}
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
