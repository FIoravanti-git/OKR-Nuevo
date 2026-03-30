"use client";

import { ChevronRight, Eye, MoreHorizontal, Pencil, SlidersHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { ActivityStatus } from "@/generated/prisma";
import { deleteActivity, setActivityStatus } from "@/lib/activities/actions";
import { activityStatusLabel } from "@/lib/format";
import { ActivityQuickProgressModal } from "@/components/activities/activity-quick-progress-modal";
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

type ActivityRowActionsProps = {
  activityId: string;
  activityTitle: string;
  currentStatus: ActivityStatus;
  currentProgress: number | null;
  canMutate: boolean;
};

const STATUSES: ActivityStatus[] = ["PLANNED", "IN_PROGRESS", "DONE", "BLOCKED", "CANCELLED"];

export function ActivityRowActions({
  activityId,
  activityTitle,
  currentStatus,
  currentProgress,
  canMutate,
}: ActivityRowActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [quickOpen, setQuickOpen] = useState(false);

  function applyStatus(status: ActivityStatus) {
    startTransition(async () => {
      const r = await setActivityStatus(activityId, status);
      if (r.ok) {
        toast.success(`Estado: ${activityStatusLabel(status)}`);
        router.refresh();
      } else {
        toast.error(r.message);
      }
    });
  }

  function handleDelete() {
    const ok = window.confirm("¿Eliminar esta actividad? Se eliminará también su bitácora de avances.");
    if (!ok) return;
    startTransition(async () => {
      const r = await deleteActivity(activityId);
      if (r.ok) {
        toast.success("Actividad eliminada");
        router.push("/actividades");
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
          aria-label="Acciones de la actividad"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => router.push(`/actividades/${activityId}`)}>
            <Eye className="size-4" />
            Ver detalle
          </DropdownMenuItem>
          {canMutate ? (
            <DropdownMenuItem onClick={() => router.push(`/actividades/${activityId}/edit`)}>
              <Pencil className="size-4" />
              Editar
            </DropdownMenuItem>
          ) : null}
          {canMutate ? (
            <>
              <DropdownMenuItem onClick={() => setQuickOpen(true)}>
                <SlidersHorizontal className="size-4" />
                Registrar avance
              </DropdownMenuItem>
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
                      {activityStatusLabel(s)}
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
      <ActivityQuickProgressModal
        open={quickOpen}
        onOpenChange={setQuickOpen}
        activityId={activityId}
        activityTitle={activityTitle}
        currentStatus={currentStatus}
        currentProgress={currentProgress}
      />
    </>
  );
}
