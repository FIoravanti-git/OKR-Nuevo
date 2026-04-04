"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteUser } from "@/lib/users/actions";
import { MSG_USER_DELETE_BLOCKED } from "@/lib/users/user-delete-messages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type UserDeleteSectionProps = {
  userId: string;
  userName: string;
  canDelete: boolean;
};

export function UserDeleteSection({ userId, userName, canDelete }: UserDeleteSectionProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function runDelete() {
    if (!canDelete) {
      toast.error(MSG_USER_DELETE_BLOCKED);
      return;
    }
    const ok = window.confirm(
      `¿Eliminar a ${userName} de forma permanente? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    startTransition(async () => {
      const r = await deleteUser(userId);
      if (r.ok) {
        toast.success("Usuario eliminado");
        router.push("/usuarios");
        router.refresh();
        return;
      }
      toast.error(r.message);
    });
  }

  return (
    <Card className="max-w-2xl border-destructive/20 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base text-destructive">Eliminar usuario</CardTitle>
        <CardDescription>
          Solo podés borrar una cuenta si no tiene tareas, áreas, historial de cambios ni registros de auditoría
          asociados. En otros casos, desactivá la cuenta.
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
