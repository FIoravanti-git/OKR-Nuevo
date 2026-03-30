"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { recalculateKeyResultProgress } from "@/lib/key-results/actions";
import { Button } from "@/components/ui/button";

type RecalculateKeyResultButtonProps = {
  keyResultId: string;
  calculationMode: "MANUAL" | "AUTOMATIC" | "HYBRID";
};

export function RecalculateKeyResultButton({ keyResultId, calculationMode }: RecalculateKeyResultButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (calculationMode === "MANUAL") {
    return null;
  }

  function handleClick() {
    startTransition(async () => {
      const r = await recalculateKeyResultProgress(keyResultId);
      if (r.ok) {
        toast.success("Progreso recalculado");
        router.refresh();
      } else {
        toast.error(r.message);
      }
    });
  }

  return (
    <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={pending} onClick={handleClick}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
      Recalcular progreso
    </Button>
  );
}
