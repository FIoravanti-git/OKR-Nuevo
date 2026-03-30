"use client";

import { ChevronRight, Eye, Gauge, MoreHorizontal, Pencil, SlidersHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { KeyResultCalculationMode, KeyResultStatus } from "@/generated/prisma";
import { deleteKeyResult, setKeyResultStatus } from "@/lib/key-results/actions";
import { keyResultStatusLabel } from "@/lib/format";
import { KeyResultQuickCurrentValueModal } from "@/components/key-results/key-result-quick-current-value-modal";
import { KeyResultQuickProgressModal } from "@/components/key-results/key-result-quick-progress-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type KeyResultRowActionsProps = {
  keyResultId: string;
  keyResultTitle: string;
  currentStatus: KeyResultStatus;
  calculationMode: KeyResultCalculationMode;
  currentProgress: number | null;
  currentValue: number | null;
  initialValue: number | null;
  targetValue: number | null;
  unit: string | null;
  metricType: "NUMBER" | "PERCENT" | "CURRENCY" | "COUNT" | "CUSTOM";
  canMutate: boolean;
  onQuickUpdated?: (next: {
    currentValue: number | null;
    progressCached: number | null;
    status: KeyResultStatus;
  }) => void;
};

const STATUSES: KeyResultStatus[] = ["DRAFT", "ON_TRACK", "AT_RISK", "COMPLETED", "CANCELLED"];

export function KeyResultRowActions({
  keyResultId,
  keyResultTitle,
  currentStatus,
  calculationMode,
  currentProgress,
  currentValue,
  initialValue,
  targetValue,
  unit,
  metricType,
  canMutate,
  onQuickUpdated,
}: KeyResultRowActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [quickOpen, setQuickOpen] = useState(false);
  const [metricQuickOpen, setMetricQuickOpen] = useState(false);
  const isManual = calculationMode === "MANUAL";
  const isMetricEditable = calculationMode === "AUTOMATIC" || calculationMode === "HYBRID";

  function applyStatus(status: KeyResultStatus) {
    startTransition(async () => {
      const r = await setKeyResultStatus(keyResultId, status);
      if (r.ok) {
        toast.success(`Estado: ${keyResultStatusLabel(status)}`);
        router.refresh();
      } else {
        toast.error(r.message);
      }
    });
  }

  function handleDelete() {
    const ok = window.confirm(
      "¿Eliminar este resultado clave? Se eliminarán en cascada las actividades vinculadas."
    );
    if (!ok) return;
    startTransition(async () => {
      const r = await deleteKeyResult(keyResultId);
      if (r.ok) {
        toast.success("Resultado clave eliminado");
        router.push("/resultados-clave");
        router.refresh();
      } else {
        toast.error(r.message);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex size-8 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Acciones del resultado clave"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => router.push(`/resultados-clave/${keyResultId}`)}>
            <Eye className="size-4" />
            Ver detalle
          </DropdownMenuItem>
          {canMutate ? (
            <DropdownMenuItem onClick={() => router.push(`/resultados-clave/${keyResultId}/edit`)}>
              <Pencil className="size-4" />
              Editar
            </DropdownMenuItem>
          ) : null}
          {canMutate ? (
            <>
              {isManual ? (
                <DropdownMenuItem onClick={() => setQuickOpen(true)}>
                  <SlidersHorizontal className="size-4" />
                  Registrar avance
                </DropdownMenuItem>
              ) : null}
              {isMetricEditable ? (
                <DropdownMenuItem onClick={() => setMetricQuickOpen(true)}>
                  <Gauge className="size-4" />
                  Actualizar valor actual
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  Cambiar estado
                  <ChevronRight className="ml-auto size-4" />
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {STATUSES.map((s) => (
                    <DropdownMenuItem
                      key={s}
                      disabled={pending || s === currentStatus}
                      onClick={() => applyStatus(s)}
                    >
                      {keyResultStatusLabel(s)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" disabled={pending} onClick={handleDelete}>
                <Trash2 className="size-4" />
                Eliminar
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {isManual ? (
        <KeyResultQuickProgressModal
          open={quickOpen}
          onOpenChange={setQuickOpen}
          keyResultId={keyResultId}
          keyResultTitle={keyResultTitle}
          calculationMode={calculationMode}
          currentProgress={currentProgress}
        />
      ) : null}
      <KeyResultQuickCurrentValueModal
        open={metricQuickOpen}
        onOpenChange={setMetricQuickOpen}
        keyResultId={keyResultId}
        keyResultTitle={keyResultTitle}
        metricType={metricType}
        unit={unit}
        initialValue={initialValue}
        targetValue={targetValue}
        currentValue={currentValue}
        onSaved={(next) => onQuickUpdated?.(next)}
      />
    </>
  );
}
