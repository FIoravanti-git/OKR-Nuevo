"use client";

import { MoreHorizontal, Pencil, Power } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { toggleUserActive } from "@/lib/users/actions";
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
};

export function UserRowActions({ userId, isActive, viewerId }: UserRowActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const cannotDeactivateSelf = isActive && userId === viewerId;

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-8 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Acciones de usuario"
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
