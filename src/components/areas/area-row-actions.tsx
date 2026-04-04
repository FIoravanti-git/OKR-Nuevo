"use client";

import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteArea } from "@/lib/areas/actions";
import { MSG_AREA_DELETE_BLOCKED } from "@/lib/areas/area-delete-messages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AreaRowActionsProps = {
  areaId: string;
  canDelete: boolean;
  viewerCanMutate: boolean;
};

export function AreaRowActions({ areaId, canDelete, viewerCanMutate }: AreaRowActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    const ok = window.confirm(
      "¿Eliminar esta área de forma permanente? Esta acción no se puede deshacer."
    );
    if (!ok) return;
    startTransition(async () => {
      const r = await deleteArea(areaId);
      if (r.ok) {
        toast.success("Área eliminada");
        router.refresh();
        return;
      }
      toast.error(r.message);
    });
  }

  function handleDeleteBlocked() {
    toast.error(MSG_AREA_DELETE_BLOCKED);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        className="inline-flex size-8 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        aria-label="Acciones del área"
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => router.push(`/areas/${areaId}`)}>
          <Eye className="size-4" />
          Ver detalle
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/areas/${areaId}/edit`)}>
          <Pencil className="size-4" />
          Editar
        </DropdownMenuItem>
        {viewerCanMutate ? (
          <>
            <DropdownMenuSeparator />
            {canDelete ? (
              <DropdownMenuItem variant="destructive" onClick={handleDelete} disabled={pending}>
                <Trash2 className="size-4" />
                Eliminar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem variant="destructive" onClick={handleDeleteBlocked}>
                <Trash2 className="size-4" />
                Eliminar
              </DropdownMenuItem>
            )}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
