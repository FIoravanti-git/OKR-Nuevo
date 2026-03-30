"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { recalculateStrategicObjectiveProgress } from "@/lib/strategic-objectives/actions";
import { Button } from "@/components/ui/button";

type RecalculateStrategicProgressButtonProps = {
  strategicId: string;
};

export function RecalculateStrategicProgressButton({ strategicId }: RecalculateStrategicProgressButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const r = await recalculateStrategicObjectiveProgress(strategicId);
      if (r.ok) {
        toast.success("Progreso actualizado desde resultados clave");
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
