"use client";

import { ChevronRight, Eye, MoreHorizontal, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { InstitutionalObjectiveStatus } from "@/generated/prisma";
import { setInstitutionalObjectiveStatus } from "@/lib/institutional-objectives/actions";
import { institutionalObjectiveStatusLabel } from "@/lib/format";
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

type InstitutionalObjectiveRowActionsProps = {
  objectiveId: string;
  currentStatus: InstitutionalObjectiveStatus;
  canMutate: boolean;
};

const STATUSES: InstitutionalObjectiveStatus[] = ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"];

export function InstitutionalObjectiveRowActions({
  objectiveId,
  currentStatus,
  canMutate,
}: InstitutionalObjectiveRowActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function applyStatus(status: InstitutionalObjectiveStatus) {
    startTransition(async () => {
      const r = await setInstitutionalObjectiveStatus(objectiveId, status);
      if (r.ok) {
        toast.success(`Estado: ${institutionalObjectiveStatusLabel(status)}`);
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
        aria-label="Acciones del objetivo"
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => router.push(`/objetivos/${objectiveId}`)}>
          <Eye className="size-4" />
          Ver detalle
        </DropdownMenuItem>
        {canMutate ? (
          <DropdownMenuItem onClick={() => router.push(`/objetivos/${objectiveId}/edit`)}>
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
                    {institutionalObjectiveStatusLabel(s)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
