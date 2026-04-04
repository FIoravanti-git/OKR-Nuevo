"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteArea } from "@/lib/areas/actions";
import { MSG_AREA_DELETE_BLOCKED } from "@/lib/areas/area-delete-messages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AreaDeleteSectionProps = {
  areaId: string;
  areaName: string;
  canDelete: boolean;
};

export function AreaDeleteSection({ areaId, areaName, canDelete }: AreaDeleteSectionProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function runDelete() {
    if (!canDelete) {
      toast.error(MSG_AREA_DELETE_BLOCKED);
      return;
    }
    const ok = window.confirm(
      `¿Eliminar el área «${areaName}» de forma permanente? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    startTransition(async () => {
      const r = await deleteArea(areaId);
      if (r.ok) {
        toast.success("Área eliminada");
        router.push("/areas");
        router.refresh();
        return;
      }
      toast.error(r.message);
    });
  }

  return (
    <Card className="max-w-2xl border-destructive/20 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base text-destructive">Eliminar área</CardTitle>
        <CardDescription>
          Solo podés borrar un área si no tiene equipo, objetivos, resultados ni tareas vinculadas. Si tiene datos,
          desactivala desde la edición.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          variant="destructive"
          className="gap-1.5"
          disabled={pending}
          onClick={runDelete}
        >
          <Trash2 className="size-4" />
          Eliminar del sistema
        </Button>
      </CardContent>
    </Card>
  );
}
