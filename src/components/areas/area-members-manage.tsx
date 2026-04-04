"use client";

import Link from "next/link";
import { Crown, MoreHorizontal, UserMinus, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addUserToArea, removeUserFromArea, setMemberResponsible } from "@/lib/areas/member-actions";
import { roleLabel } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/generated/prisma";

export type AreaMemberRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  esResponsable: boolean;
};

export type AreaMemberCandidate = {
  id: string;
  name: string;
  email: string;
};

type AreaMembersManageProps = {
  areaId: string;
  members: AreaMemberRow[];
  /** Cantidad de personas con rol de responsable (para validar el último). */
  responsablesCount: number;
  candidates: AreaMemberCandidate[];
  /** En vista detalle (solo lectura parcial) se oculta el bloque para sumar miembros. */
  showAddSection?: boolean;
};

function MemberRowCard({
  u,
  areaId,
  isPending,
  variant,
  soleResponsible,
  onRun,
}: {
  u: AreaMemberRow;
  areaId: string;
  isPending: boolean;
  variant: "responsable" | "miembro";
  soleResponsible: boolean;
  onRun: (action: () => Promise<{ ok: boolean; message?: string }>, successMsg: string) => void;
}) {
  const isResponsable = u.esResponsable;

  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        variant === "responsable"
          ? "border-amber-500/20 bg-amber-500/[0.06] dark:bg-amber-500/[0.08]"
          : "border-border/70 bg-card"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-foreground">{u.name}</p>
          {isResponsable ? (
            <Badge className="gap-0.5 border-amber-500/25 bg-amber-500/10 font-normal text-amber-950 dark:text-amber-100">
              <Crown className="size-3" />
              Responsable
            </Badge>
          ) : null}
          <Badge variant="secondary" className="font-normal text-xs">
            {roleLabel(u.role)}
          </Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          render={<Link href={`/usuarios/${u.id}/edit`} />}
        >
          Ver perfil
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={isPending}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            aria-label={`Acciones para ${u.name}`}
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {variant === "miembro" ? (
              <>
                <DropdownMenuItem
                  onClick={() =>
                    onRun(
                      () => setMemberResponsible(areaId, u.id, true),
                      `${u.name} ahora es responsable del área`
                    )
                  }
                >
                  <Crown className="size-4 text-amber-600" />
                  Marcar como responsable
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            ) : null}
            {variant === "responsable" && !soleResponsible ? (
              <>
                <DropdownMenuItem
                  onClick={() =>
                    onRun(
                      () => setMemberResponsible(areaId, u.id, false),
                      `${u.name} dejó de ser responsable (sigue en el equipo)`
                    )
                  }
                >
                  <UserMinus className="size-4" />
                  Quitar rol de responsable
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            ) : null}
            {variant === "responsable" && soleResponsible ? (
              <>
                <DropdownMenuItem disabled className="text-muted-foreground">
                  <UserMinus className="size-4" />
                  Quitar rol de responsable
                  <span className="sr-only">(no disponible si es el único responsable)</span>
                </DropdownMenuItem>
                <p className="px-2 pb-1 text-xs text-muted-foreground">
                  Hay que haber al menos un responsable. Sumá a otra persona como responsable antes de quitar este
                  rol.
                </p>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuItem
              variant="destructive"
              disabled={soleResponsible && isResponsable}
              title={
                soleResponsible && isResponsable
                  ? "Asigná otro responsable antes de quitar a esta persona del área"
                  : undefined
              }
              onClick={() => {
                if (soleResponsible && isResponsable) return;
                const ok = window.confirm(
                  `¿Sacar a ${u.name} del área? Si solo tenía el rol de responsable, podés volver a invitarlo después.`
                );
                if (!ok) return;
                onRun(() => removeUserFromArea(areaId, u.id), "Persona quitada del área");
              }}
            >
              Quitar del área
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

export function AreaMembersManage({
  areaId,
  members,
  responsablesCount,
  candidates,
  showAddSection = true,
}: AreaMembersManageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedUserId, setSelectedUserId] = useState("");

  const responsables = members.filter((m) => m.esResponsable);
  const soloMiembros = members.filter((m) => !m.esResponsable);

  function run(action: () => Promise<{ ok: boolean; message?: string }>, successMsg: string) {
    startTransition(async () => {
      const r = await action();
      if (!r.ok) {
        toast.error("message" in r && r.message ? r.message : "No se pudo completar la acción.");
        return;
      }
      toast.success(successMsg);
      setSelectedUserId("");
      router.refresh();
    });
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/15 pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base">Equipo del área</CardTitle>
              <CardDescription className="mt-1">
                {showAddSection
                  ? "Responsables y personas que participan. Podés sumar o quitar integrantes de la empresa."
                  : "Responsables y participantes. Para cambios, usá Editar área."}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8 pt-6">
        {showAddSection ? (
          <>
            {candidates.length > 0 ? (
              <div className="rounded-xl border border-border/80 bg-muted/10 p-4">
                <p className="mb-3 text-sm font-medium text-foreground">Agregar al equipo</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <label htmlFor={`add-member-${areaId}`} className="text-xs text-muted-foreground">
                      Persona de la empresa
                    </label>
                    <select
                      id={`add-member-${areaId}`}
                      disabled={isPending}
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className={cn(
                        "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none",
                        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
                        "disabled:opacity-60 dark:bg-input/30"
                      )}
                    >
                      <option value="">Seleccionar…</option>
                      {candidates.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    disabled={isPending || !selectedUserId}
                    className="shrink-0 gap-1.5 sm:mb-0"
                    onClick={() => {
                      if (!selectedUserId) return;
                      run(() => addUserToArea(areaId, selectedUserId), "Persona agregada al área");
                    }}
                  >
                    <UserPlus className="size-4" />
                    Agregar
                  </Button>
                </div>
              </div>
            ) : members.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/80 bg-muted/5 px-4 py-6 text-center text-sm text-muted-foreground">
                No hay más personas activas en la empresa para sumar. Podés invitar o activar cuentas desde{" "}
                <Link href="/usuarios" className="font-medium text-primary underline-offset-4 hover:underline">
                  Usuarios
                </Link>
                .
              </p>
            ) : null}
          </>
        ) : null}

        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/60 pb-2">
            <Crown className="size-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-foreground">Responsables</h3>
            <span className="text-xs text-muted-foreground">({responsables.length})</span>
          </div>
          {responsables.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/70 bg-muted/5 px-4 py-6 text-center text-sm text-muted-foreground">
              {showAddSection
                ? "Todavía no hay responsables. Marcá a alguien del equipo o agregá una persona y designala responsable."
                : "Sin responsables asignados."}
            </p>
          ) : (
            <ul className="space-y-2">
              {responsables.map((u) => (
                <MemberRowCard
                  key={u.id}
                  u={u}
                  areaId={areaId}
                  isPending={isPending}
                  variant="responsable"
                  soleResponsible={responsablesCount === 1 && u.esResponsable}
                  onRun={run}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/60 pb-2">
            <Users className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Miembros</h3>
            <span className="text-xs text-muted-foreground">({soloMiembros.length})</span>
          </div>
          {soloMiembros.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/70 bg-muted/5 px-4 py-6 text-center text-sm text-muted-foreground">
              {members.length === 0
                ? showAddSection
                  ? "Todavía no hay nadie en el equipo."
                  : "Sin miembros cargados."
                : "No hay miembros sin rol de responsable (todos figuran arriba)."}
            </p>
          ) : (
            <ul className="space-y-2">
              {soloMiembros.map((u) => (
                <MemberRowCard
                  key={u.id}
                  u={u}
                  areaId={areaId}
                  isPending={isPending}
                  variant="miembro"
                  soleResponsible={false}
                  onRun={run}
                />
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
