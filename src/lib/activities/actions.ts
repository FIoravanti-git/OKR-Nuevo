"use server";

/**
 * Actividades → KR: tras mutaciones se llama a `rollupKeyResultChainFromKeyResultId` (ver
 * `recalculate-strategic-progress` y motor puro `strategic-progress-engine`).
 */

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma";
import type { ActivityStatus } from "@/generated/prisma";
import { requireSessionUser } from "@/lib/auth/session-user";
import {
  canMutateActivities,
  canMutateActivity,
  canUpdateActivityProgress,
  canViewActivity,
} from "@/lib/activities/policy";
import {
  activityFormSchema,
  activityProgressFormSchema,
  activityStatusSchema,
} from "@/lib/activities/schemas";
import { revalidateOkrHierarchyPaths } from "@/lib/okr/revalidate-okr-paths";
import { rollupKeyResultChainFromKeyResultId } from "@/lib/okr/rollup-key-result-chain";
import { canMutateKeyResult } from "@/lib/key-results/policy";
import { prisma } from "@/lib/prisma";

export type ActivityActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

function parseOptionalDateStart(s: string | undefined): Date | null {
  const t = s?.trim();
  if (!t) return null;
  const [y, m, d] = t.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function parseOptionalDateEnd(s: string | undefined): Date | null {
  const t = s?.trim();
  if (!t) return null;
  const [y, m, d] = t.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
}

function parseProgressPercentStr(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  return Number(Number(t.replace(",", ".")).toFixed(2));
}

/** Estado derivado solo del % (0–100); no usar con BLOQUEADA/CANCELADA. */
function deriveActivityStatusFromProgressPercent(
  progressPercent: number | null
): "PLANNED" | "IN_PROGRESS" | "DONE" {
  const p =
    progressPercent == null || Number.isNaN(progressPercent)
      ? 0
      : Math.min(100, Math.max(0, progressPercent));
  if (p >= 100) return "DONE";
  if (p > 0) return "IN_PROGRESS";
  return "PLANNED";
}

/**
 * Al guardar: el avance define HECHA / EN_PROGRESO / PLANIFICADA.
 * Si el formulario envía BLOQUEADA o CANCELADA, se respeta (no se aplica la regla por %).
 */
function resolveActivityStatusOnSave(params: {
  formStatus: ActivityStatus;
  progressPercent: number | null;
}): ActivityStatus {
  const { formStatus, progressPercent } = params;
  if (formStatus === "BLOCKED" || formStatus === "CANCELLED") {
    return formStatus;
  }
  return deriveActivityStatusFromProgressPercent(progressPercent);
}

function normalizeActivityStatusBehavior(params: {
  status: ActivityStatus;
  submittedProgress: number | null;
  previousProgress: number | null;
  submittedImpactsProgress: boolean;
  previousImpactsProgress: boolean;
}): { progress: number | null; impactsProgress: boolean } {
  const { status, submittedProgress, previousProgress, submittedImpactsProgress, previousImpactsProgress } = params;

  if (status === "PLANNED") {
    return { progress: 0, impactsProgress: submittedImpactsProgress };
  }
  if (status === "IN_PROGRESS") {
    return { progress: submittedProgress, impactsProgress: submittedImpactsProgress };
  }
  if (status === "DONE") {
    return { progress: 100, impactsProgress: submittedImpactsProgress };
  }
  if (status === "BLOCKED") {
    return {
      progress: previousProgress ?? submittedProgress,
      impactsProgress: previousImpactsProgress,
    };
  }
  // CANCELLED
  return { progress: 0, impactsProgress: false };
}

async function revalidateActivityScope(keyResultId: string, activityId?: string) {
  revalidatePath("/actividades");
  if (activityId) {
    revalidatePath(`/actividades/${activityId}`);
    revalidatePath(`/actividades/${activityId}/edit`);
  }
  const kr = await prisma.keyResult.findUnique({
    where: { id: keyResultId },
    select: {
      strategicObjectiveId: true,
      strategicObjective: { select: { institutionalObjectiveId: true } },
    },
  });
  if (!kr) return;
  await revalidateOkrHierarchyPaths({
    institutionalObjectiveId: kr.strategicObjective.institutionalObjectiveId,
    strategicObjectiveId: kr.strategicObjectiveId,
    keyResultId,
  });
}

async function assertAssigneeInCompany(assigneeUserId: string | undefined, companyId: string) {
  if (!assigneeUserId) return null;
  const u = await prisma.user.findFirst({
    where: { id: assigneeUserId, companyId, isActive: true },
    select: { id: true },
  });
  return u;
}

async function appendActivityLogIfChanged(params: {
  companyId: string;
  activityId: string;
  actorId: string | null;
  prevP: number | null;
  newP: number | null;
  prevS: ActivityStatus;
  newS: ActivityStatus;
  note?: string | null;
}) {
  const pChanged = params.prevP !== params.newP;
  const sChanged = params.prevS !== params.newS;
  if (!pChanged && !sChanged) return;

  const noteTrim = params.note?.trim() || null;

  await prisma.activityProgressLog.create({
    data: {
      companyId: params.companyId,
      activityId: params.activityId,
      previousProgress: pChanged
        ? params.prevP != null
          ? new Prisma.Decimal(params.prevP.toFixed(2))
          : null
        : null,
      newProgress: pChanged
        ? params.newP != null
          ? new Prisma.Decimal(params.newP.toFixed(2))
          : null
        : null,
      previousStatus: sChanged ? params.prevS : null,
      newStatus: sChanged ? params.newS : null,
      note: noteTrim,
      changedByUserId: params.actorId,
    },
  });
}

export async function createActivity(input: unknown): Promise<ActivityActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateActivities(actor)) {
    return { ok: false, message: "No tenés permiso para crear actividades." };
  }

  const parsed = activityFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá los campos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const kr = await prisma.keyResult.findUnique({
    where: { id: parsed.data.keyResultId },
    select: { id: true, companyId: true },
  });
  if (!kr) {
    return { ok: false, message: "El resultado clave no existe." };
  }
  if (!canMutateKeyResult(actor, kr.companyId)) {
    return { ok: false, message: "No podés crear actividades para ese resultado clave." };
  }

  const assignee = await assertAssigneeInCompany(parsed.data.assigneeUserId, kr.companyId);
  if (parsed.data.assigneeUserId && !assignee) {
    return { ok: false, message: "El responsable debe ser un usuario activo de la misma empresa." };
  }

  const d = parsed.data;
  const startDate = parseOptionalDateStart(d.startDate);
  const dueDate = parseOptionalDateEnd(d.dueDate);
  const progressVal = parseProgressPercentStr(d.progressContributionStr);
  const effectiveStatus = resolveActivityStatusOnSave({
    formStatus: d.status,
    progressPercent: progressVal,
  });
  const normalized = normalizeActivityStatusBehavior({
    status: effectiveStatus,
    submittedProgress: progressVal,
    previousProgress: null,
    submittedImpactsProgress: d.impactsProgress,
    previousImpactsProgress: d.impactsProgress,
  });

  await prisma.activity.create({
    data: {
      companyId: kr.companyId,
      keyResultId: kr.id,
      title: d.title,
      description: d.description ?? null,
      assigneeUserId: d.assigneeUserId ?? null,
      startDate,
      dueDate,
      status: effectiveStatus,
      impactsProgress: normalized.impactsProgress,
      contributionWeight: new Prisma.Decimal(String(d.contributionWeight)),
      progressContribution:
        normalized.progress == null ? null : new Prisma.Decimal(normalized.progress.toFixed(2)),
    },
  });

  await rollupKeyResultChainFromKeyResultId(kr.id);
  await revalidateActivityScope(kr.id);

  return { ok: true };
}

export async function updateActivity(activityId: string, input: unknown): Promise<ActivityActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateActivities(actor)) {
    return { ok: false, message: "No tenés permiso para editar actividades." };
  }

  const existing = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { id: true, companyId: true, keyResultId: true },
  });
  if (!existing) {
    return { ok: false, message: "Actividad no encontrada." };
  }
  if (!canViewActivity(actor, existing.companyId)) {
    return { ok: false, message: "No tenés acceso a esta actividad." };
  }
  if (!canMutateActivity(actor, existing.companyId)) {
    return { ok: false, message: "No podés modificar esta actividad." };
  }

  const parsed = activityFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá los campos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  if (parsed.data.keyResultId !== existing.keyResultId) {
    return { ok: false, message: "No se puede cambiar el resultado clave asociado." };
  }

  const kr = await prisma.keyResult.findUnique({
    where: { id: existing.keyResultId },
    select: { companyId: true },
  });
  if (!kr) {
    return { ok: false, message: "Resultado clave no encontrado." };
  }

  const assignee = await assertAssigneeInCompany(parsed.data.assigneeUserId, kr.companyId);
  if (parsed.data.assigneeUserId && !assignee) {
    return { ok: false, message: "El responsable debe ser un usuario activo de la misma empresa." };
  }

  const prev = await prisma.activity.findUnique({
    where: { id: activityId },
    select: {
      status: true,
      progressContribution: true,
      impactsProgress: true,
    },
  });

  const d = parsed.data;
  const startDate = parseOptionalDateStart(d.startDate);
  const dueDate = parseOptionalDateEnd(d.dueDate);
  const newP = parseProgressPercentStr(d.progressContributionStr);

  const prevP = prev?.progressContribution != null ? Number(prev.progressContribution) : null;
  const prevImpacts = prev?.impactsProgress ?? d.impactsProgress;
  const effectiveStatus = resolveActivityStatusOnSave({
    formStatus: d.status,
    progressPercent: newP,
  });
  const normalized = normalizeActivityStatusBehavior({
    status: effectiveStatus,
    submittedProgress: newP,
    previousProgress: prevP,
    submittedImpactsProgress: d.impactsProgress,
    previousImpactsProgress: prevImpacts,
  });

  await prisma.activity.update({
    where: { id: activityId },
    data: {
      title: d.title,
      description: d.description ?? null,
      assigneeUserId: d.assigneeUserId ?? null,
      startDate,
      dueDate,
      status: effectiveStatus,
      impactsProgress: normalized.impactsProgress,
      contributionWeight: new Prisma.Decimal(String(d.contributionWeight)),
      progressContribution:
        normalized.progress == null ? null : new Prisma.Decimal(normalized.progress.toFixed(2)),
    },
  });

  await appendActivityLogIfChanged({
    companyId: existing.companyId,
    activityId,
    actorId: actor.id,
    prevP,
    newP: normalized.progress,
    prevS: prev!.status,
    newS: effectiveStatus,
    note: d.observation ?? null,
  });

  await rollupKeyResultChainFromKeyResultId(existing.keyResultId);
  await revalidateActivityScope(existing.keyResultId, activityId);

  return { ok: true };
}

export async function updateActivityProgressSnapshot(
  activityId: string,
  input: unknown
): Promise<ActivityActionResult> {
  const actor = await requireSessionUser();

  const parsed = activityProgressFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá el seguimiento.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const existing = await prisma.activity.findUnique({
    where: { id: activityId },
    select: {
      companyId: true,
      keyResultId: true,
      assigneeUserId: true,
      status: true,
      progressContribution: true,
      impactsProgress: true,
    },
  });
  if (!existing) {
    return { ok: false, message: "Actividad no encontrada." };
  }

  if (!canViewActivity(actor, existing.companyId)) {
    return { ok: false, message: "No tenés acceso a esta actividad." };
  }

  if (!canUpdateActivityProgress(actor, existing)) {
    return { ok: false, message: "No tenés permiso para actualizar el avance de esta actividad." };
  }

  const t = parsed.data.progressInput.trim();
  const newP = t === "" ? null : Number(Number(t.replace(",", ".")).toFixed(2));
  const effectiveStatus = resolveActivityStatusOnSave({
    formStatus: parsed.data.status,
    progressPercent: newP,
  });

  const prevP = existing.progressContribution != null ? Number(existing.progressContribution) : null;
  const normalized = normalizeActivityStatusBehavior({
    status: effectiveStatus,
    submittedProgress: newP,
    previousProgress: prevP,
    submittedImpactsProgress: existing.impactsProgress,
    previousImpactsProgress: existing.impactsProgress,
  });

  const noStatusChange = existing.status === effectiveStatus;
  const noProgressChange = prevP === normalized.progress;
  const noImpactChange = existing.impactsProgress === normalized.impactsProgress;
  if (noStatusChange && noProgressChange && noImpactChange) {
    return { ok: false, message: "No hay cambios para guardar" };
  }

  await prisma.activity.update({
    where: { id: activityId },
    data: {
      status: effectiveStatus,
      impactsProgress: normalized.impactsProgress,
      progressContribution:
        normalized.progress == null ? null : new Prisma.Decimal(normalized.progress.toFixed(2)),
    },
  });

  await appendActivityLogIfChanged({
    companyId: existing.companyId,
    activityId,
    actorId: actor.id,
    prevP,
    newP: normalized.progress,
    prevS: existing.status,
    newS: effectiveStatus,
    note: parsed.data.observation ?? null,
  });

  await rollupKeyResultChainFromKeyResultId(existing.keyResultId);
  await revalidateActivityScope(existing.keyResultId, activityId);

  return { ok: true };
}

function parseActivityNote(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (t === "") return null;
  return t.length > 2000 ? t.slice(0, 2000) : t;
}

export async function setActivityStatus(
  activityId: string,
  statusRaw: unknown,
  noteRaw?: unknown
): Promise<ActivityActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateActivities(actor)) {
    return { ok: false, message: "No tenés permiso para cambiar el estado." };
  }

  const st = activityStatusSchema.safeParse(statusRaw);
  if (!st.success) {
    return { ok: false, message: "Estado no válido." };
  }

  const status = st.data as ActivityStatus;

  const row = await prisma.activity.findUnique({
    where: { id: activityId },
    select: {
      companyId: true,
      keyResultId: true,
      status: true,
      progressContribution: true,
      impactsProgress: true,
    },
  });
  if (!row) {
    return { ok: false, message: "Actividad no encontrada." };
  }

  if (!canMutateActivity(actor, row.companyId)) {
    return { ok: false, message: "No podés modificar esta actividad." };
  }

  const prevP = row.progressContribution != null ? Number(row.progressContribution) : null;
  const normalized = normalizeActivityStatusBehavior({
    status,
    submittedProgress: prevP,
    previousProgress: prevP,
    submittedImpactsProgress: row.impactsProgress,
    previousImpactsProgress: row.impactsProgress,
  });

  await prisma.activity.update({
    where: { id: activityId },
    data: {
      status,
      impactsProgress: normalized.impactsProgress,
      progressContribution:
        normalized.progress == null ? null : new Prisma.Decimal(normalized.progress.toFixed(2)),
    },
  });

  await appendActivityLogIfChanged({
    companyId: row.companyId,
    activityId,
    actorId: actor.id,
    prevP,
    newP: normalized.progress,
    prevS: row.status,
    newS: status,
    note: parseActivityNote(noteRaw),
  });

  await rollupKeyResultChainFromKeyResultId(row.keyResultId);
  await revalidateActivityScope(row.keyResultId, activityId);

  return { ok: true };
}

export async function deleteActivity(activityId: string): Promise<ActivityActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateActivities(actor)) {
    return { ok: false, message: "No tenés permiso para eliminar actividades." };
  }

  const row = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { companyId: true, keyResultId: true },
  });
  if (!row) {
    return { ok: false, message: "Actividad no encontrada." };
  }

  if (!canMutateActivity(actor, row.companyId)) {
    return { ok: false, message: "No podés eliminar esta actividad." };
  }

  const krId = row.keyResultId;

  await prisma.activity.delete({ where: { id: activityId } });

  await rollupKeyResultChainFromKeyResultId(krId);
  await revalidateActivityScope(krId);

  return { ok: true };
}
