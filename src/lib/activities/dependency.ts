import type { ActivityStatus } from "@/generated/prisma";

export function isPredecessorDone(status: ActivityStatus): boolean {
  return status === "DONE";
}

/** True si la predecesora aún no está hecha o no existe (tratamos como bloqueo). */
export function isBlockedByPredecessor(
  dependsOnActivityId: string | null | undefined,
  predecessorStatus: ActivityStatus | null | undefined
): boolean {
  if (!dependsOnActivityId) return false;
  if (predecessorStatus == null) return true;
  return !isPredecessorDone(predecessorStatus);
}

export function assertCanStartOrProgress(params: {
  dependsOnActivityId: string | null;
  predecessorStatus: ActivityStatus | null;
  effectiveStatus: ActivityStatus;
  progressPercent: number | null;
}): { ok: true } | { ok: false; message: string } {
  if (params.effectiveStatus === "CANCELLED" || params.effectiveStatus === "BLOCKED") {
    return { ok: true };
  }
  if (!isBlockedByPredecessor(params.dependsOnActivityId, params.predecessorStatus)) {
    return { ok: true };
  }
  if (params.effectiveStatus === "IN_PROGRESS" || params.effectiveStatus === "DONE") {
    return {
      ok: false,
      message:
        "Esta tarea depende de otra que aún no está hecha. Completá primero la actividad predecesora para poder iniciar o cerrar esta.",
    };
  }
  const p = params.progressPercent;
  if (p != null && p > 0) {
    return {
      ok: false,
      message: "No podés registrar avance hasta que la actividad de la que depende esté hecha.",
    };
  }
  return { ok: true };
}

export function utcTodayStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
}

/** Primera vez que hay trabajo real: inicio efectivo o avance > 0, con dependencia ya cumplida. */
export function shouldSetActualStartDate(params: {
  previousActualStart: Date | null;
  dependsOnActivityId: string | null;
  predecessorStatus: ActivityStatus | null;
  effectiveStatus: ActivityStatus;
  progressPercent: number | null;
}): boolean {
  if (params.previousActualStart != null) return false;
  if (isBlockedByPredecessor(params.dependsOnActivityId, params.predecessorStatus)) return false;
  if (params.effectiveStatus === "CANCELLED" || params.effectiveStatus === "BLOCKED") return false;
  const p = params.progressPercent;
  return (
    params.effectiveStatus === "IN_PROGRESS" ||
    params.effectiveStatus === "DONE" ||
    (p != null && p > 0)
  );
}

export function utcDayNumber(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Inicio planificado ya pasó y sigue bloqueada por dependencia (riesgo / atraso esperado). */
export function plannedStartPassedWhileBlocked(params: {
  startDate: Date | null;
  dependsOnActivityId: string | null;
  predecessorStatus: ActivityStatus | null;
  now?: Date;
}): boolean {
  if (!params.startDate) return false;
  if (!isBlockedByPredecessor(params.dependsOnActivityId, params.predecessorStatus)) return false;
  const now = params.now ?? new Date();
  return utcDayNumber(params.startDate) < utcDayNumber(now);
}

/** Inicio real posterior al inicio planificado (días perdidos por esperar la dependencia u otro). */
export function isDelayedStartVsPlanned(params: {
  startDate: Date | null;
  actualStartDate: Date | null;
}): boolean {
  if (!params.startDate || !params.actualStartDate) return false;
  return utcDayNumber(params.actualStartDate) > utcDayNumber(params.startDate);
}
