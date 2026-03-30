"use client";

import { ChevronRight, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { StrategicObjectiveStatus } from "@/generated/prisma";
import { deleteStrategicObjective, setStrategicObjectiveStatus } from "@/lib/strategic-objectives/actions";
import { strategicObjectiveStatusLabel } from "@/lib/format";
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

type StrategicObjectiveRowActionsProps = {
  strategicId: string;
  currentStatus: StrategicObjectiveStatus;
  canMutate: boolean;
};

const STATUSES: StrategicObjectiveStatus[] = ["DRAFT", "ACTIVE", "AT_RISK", "COMPLETED", "CANCELLED"];

export function StrategicObjectiveRowActions({
  strategicId,
  currentStatus,
  canMutate,
}: StrategicObjectiveRowActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function applyStatus(status: StrategicObjectiveStatus) {
    startTransition(async () => {
      const r = await setStrategicObjectiveStatus(strategicId, status);
      if (r.ok) {
        toast.success(`Estado: ${strategicObjectiveStatusLabel(status)}`);
        router.refresh();
      } else {
        toast.error(r.message);
      }
    });
  }

  function handleDelete() {
    const ok = window.confirm(
      "¿Eliminar este objetivo clave? Se eliminarán en cascada sus resultados clave y actividades vinculadas."
    );
    if (!ok) return;
    startTransition(async () => {
      const r = await deleteStrategicObjective(strategicId);
      if (r.ok) {
        toast.success("Objetivo clave eliminado");
        router.push("/objetivos-clave");
        router.refresh();
      } else {
        toast.error(r.message);
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-8 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Acciones del objetivo clave"
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => router.push(`/objetivos-clave/${strategicId}`)}>
          <Eye className="size-4" />
          Ver detalle
        </DropdownMenuItem>
        {canMutate ? (
          <DropdownMenuItem onClick={() => router.push(`/objetivos-clave/${strategicId}/edit`)}>
            <Pencil className="size-4" />
            Editar
          </DropdownMenuItem>
        ) : null}
        {canMutate ? (
          <>
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
                    {strategicObjectiveStatusLabel(s)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={pending}
              onClick={handleDelete}
            >
              <Trash2 className="size-4" />
              Eliminar
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
