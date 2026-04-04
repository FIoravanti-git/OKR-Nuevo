"use client";

import { MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteUser, toggleUserActive } from "@/lib/users/actions";
import { MSG_USER_DELETE_BLOCKED } from "@/lib/users/user-delete-messages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserRowActionsProps = {
  userId: string;
  isActive: boolean;
  viewerId: string;
  canDelete: boolean;
  viewerCanMutate: boolean;
};

export function UserRowActions({
  userId,
  isActive,
  viewerId,
  canDelete,
  viewerCanMutate,
}: UserRowActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const cannotDeactivateSelf = isActive && userId === viewerId;
  const isSelf = userId === viewerId;

  function handleToggle() {
    startTransition(async () => {
      const r = await toggleUserActive(userId);
      if (r.ok) {
        toast.success(isActive ? "Usuario desactivado" : "Usuario activado");
        router.refresh();
      } else {
        toast.error(r.message);
      }
    });
  }

  function handleDelete() {
    if (!canDelete) {
      toast.error(MSG_USER_DELETE_BLOCKED);
      return;
    }
    const ok = window.confirm(
      "¿Eliminar este usuario de forma permanente? Esta acción no se puede deshacer."
    );
    if (!ok) return;
    startTransition(async () => {
      const r = await deleteUser(userId);
      if (r.ok) {
        toast.success("Usuario eliminado");
        router.refresh();
        return;
      }
      toast.error(r.message);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        className="inline-flex size-8 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        aria-label="Acciones de usuario"
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => router.push(`/usuarios/${userId}/edit`)}>
          <Pencil className="size-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleToggle}
          disabled={pending || cannotDeactivateSelf}
          variant={isActive ? "destructive" : "default"}
        >
          <Power className="size-4" />
          {isActive ? "Desactivar" : "Activar"}
        </DropdownMenuItem>
        {viewerCanMutate && !isSelf ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleDelete} disabled={pending}>
              <Trash2 className="size-4" />
              Eliminar
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
