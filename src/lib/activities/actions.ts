"use server";

/**
 * Actividades → KR: tras mutaciones se llama a `rollupKeyResultChainFromKeyResultId` (ver
 * `recalculate-strategic-progress` y motor puro `strategic-progress-engine`).
 */

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma";
import type { ActivityStatus, ProgressCalculationMode } from "@/generated/prisma";
import {
  assertCanStartOrProgress,
  shouldSetActualStartDate,
  utcTodayStart,
} from "@/lib/activities/dependency";
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
import { keyResultUsesWeightedActivityAggregation } from "@/lib/okr/key-result-activity-aggregation";

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

function resolvePersistedContributionWeight(params: {
  raw: string;
  impactsProgress: boolean;
  allowActivityImpact: boolean;
  progressMode: ProgressCalculationMode;
}): { decimal: Prisma.Decimal; fieldError?: string } {
  if (!params.impactsProgress || !params.allowActivityImpact) {
    return { decimal: new Prisma.Decimal(0) };
  }
  if (!keyResultUsesWeightedActivityAggregation(params.progressMode)) {
    return { decimal: new Prisma.Decimal(1) };
  }
  const t = params.raw.trim().replace(",", ".");
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) {
    return { decimal: new Prisma.Decimal(0), fieldError: "Indicá un peso de impacto mayor a 0." };
  }
  if (n > 1_000_000) {
    return { decimal: new Prisma.Decimal(0), fieldError: "Peso demasiado alto." };
  }
  return { decimal: new Prisma.Decimal(String(n)) };
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

function resolveActualEndDateBehavior(params: {
  previousActualEndDate: Date | null;
  effectiveStatus: ActivityStatus;
}): { actualEndDate: Date | null } | null {
  const { previousActualEndDate, effectiveStatus } = params;

  if (effectiveStatus === "DONE") {
    if (!previousActualEndDate) return { actualEndDate: utcTodayStart() };
    return null;
  }

  // Más seguro para comparaciones planificado vs ejecutado:
  // si la actividad deja de estar "Hecha", se limpia el fin real.
  if (previousActualEndDate) return { actualEndDate: null };
  return null;
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

async function assertAssigneeAllowed(
  assigneeUserId: string | undefined,
  companyId: string,
  restrictedAreaId: string | null
) {
  if (!assigneeUserId) return null;
  const where: Prisma.UserWhereInput = {
    id: assigneeUserId,
    companyId,
    isActive: true,
  };
  if (restrictedAreaId) {
    where.areaMemberships = { some: { areaId: restrictedAreaId } };
  }
  return prisma.user.findFirst({
    where,
    select: { id: true },
  });
}

async function validateDependsOnInput(params: {
  companyId: string;
  editingActivityId?: string;
  dependsOnActivityId: string | undefined;
}): Promise<
  | { ok: true; predecessorStatus: ActivityStatus | null }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> }
> {
  if (!params.dependsOnActivityId) {
    return { ok: true, predecessorStatus: null };
  }
  if (params.editingActivityId && params.dependsOnActivityId === params.editingActivityId) {
    return {
      ok: false,
      message: "Una actividad no puede depender de sí misma.",
      fieldErrors: { dependsOnActivityId: ["Elegí otra actividad."] },
    };
  }
  const pred = await prisma.activity.findFirst({
    where: { id: params.dependsOnActivityId, companyId: params.companyId },
    select: { id: true, status: true },
  });
  if (!pred) {
    return {
      ok: false,
      message: "La actividad predecesora no existe o no pertenece a la misma empresa.",
      fieldErrors: { dependsOnActivityId: ["Predecesora no válida."] },
    };
  }
  let cur: string | null = params.dependsOnActivityId;
  const visited = new Set<string>();
  while (cur) {
    if (params.editingActivityId && cur === params.editingActivityId) {
      return {
        ok: false,
        message: "Esa dependencia generaría un ciclo entre actividades.",
        fieldErrors: { dependsOnActivityId: ["Elegí otra actividad."] },
      };
    }
    if (visited.has(cur)) break;
    visited.add(cur);
    const nextPredId: string | null =
      (
        await prisma.activity.findUnique({
          where: { id: cur },
          select: { dependsOnActivityId: true },
        })
      )?.dependsOnActivityId ?? null;
    cur = nextPredId;
  }
  return { ok: true, predecessorStatus: pred.status };
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
    select: {
      id: true,
      companyId: true,
      areaId: true,
      allowActivityImpact: true,
      progressMode: true,
      strategicObjective: { select: { areaId: true } },
    },
  });
  if (!kr) {
    return { ok: false, message: "El resultado clave no existe." };
  }
  if (!canMutateKeyResult(actor, kr.companyId)) {
    return { ok: false, message: "No podés crear actividades para ese resultado clave." };
  }

  const restrictedAreaId = kr.areaId ?? kr.strategicObjective.areaId ?? null;
  const assignee = await assertAssigneeAllowed(
    parsed.data.assigneeUserId,
    kr.companyId,
    restrictedAreaId
  );
  if (parsed.data.assigneeUserId && !assignee) {
    return {
      ok: false,
      message: restrictedAreaId
        ? "El responsable tiene que ser una persona activa que pertenezca al equipo del área de este resultado clave."
        : "El responsable debe ser un usuario activo de la misma empresa.",
    };
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

  const finalImpacts = kr.allowActivityImpact ? normalized.impactsProgress : false;

  const weightOutcome = resolvePersistedContributionWeight({
    raw: d.contributionWeight,
    impactsProgress: finalImpacts,
    allowActivityImpact: kr.allowActivityImpact,
    progressMode: kr.progressMode,
  });
  if (weightOutcome.fieldError) {
    return {
      ok: false,
      message: "Revisá el peso de impacto.",
      fieldErrors: { contributionWeight: [weightOutcome.fieldError] },
    };
  }

  const depRes = await validateDependsOnInput({
    companyId: kr.companyId,
    dependsOnActivityId: d.dependsOnActivityId,
  });
  if (!depRes.ok) {
    return {
      ok: false,
      message: depRes.message,
      fieldErrors: depRes.fieldErrors,
    };
  }

  const depGate = assertCanStartOrProgress({
    dependsOnActivityId: d.dependsOnActivityId ?? null,
    predecessorStatus: depRes.predecessorStatus,
    effectiveStatus,
    progressPercent: normalized.progress,
  });
  if (!depGate.ok) {
    return { ok: false, message: depGate.message };
  }

  const setActualStart = shouldSetActualStartDate({
    previousActualStart: null,
    dependsOnActivityId: d.dependsOnActivityId ?? null,
    predecessorStatus: depRes.predecessorStatus,
    effectiveStatus,
    progressPercent: normalized.progress,
  });
  const actualEndUpdate = resolveActualEndDateBehavior({
    previousActualEndDate: null,
    effectiveStatus,
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
      dependsOnActivityId: d.dependsOnActivityId ?? null,
      ...(setActualStart ? { actualStartDate: utcTodayStart() } : {}),
      ...(actualEndUpdate ?? {}),
      status: effectiveStatus,
      impactsProgress: finalImpacts,
      contributionWeight: weightOutcome.decimal,
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
    select: {
      companyId: true,
      areaId: true,
      allowActivityImpact: true,
      progressMode: true,
      strategicObjective: { select: { areaId: true } },
    },
  });
  if (!kr) {
    return { ok: false, message: "Resultado clave no encontrado." };
  }

  const restrictedAreaId = kr.areaId ?? kr.strategicObjective.areaId ?? null;
  const assignee = await assertAssigneeAllowed(
    parsed.data.assigneeUserId,
    kr.companyId,
    restrictedAreaId
  );
  if (parsed.data.assigneeUserId && !assignee) {
    return {
      ok: false,
      message: restrictedAreaId
        ? "El responsable tiene que ser una persona activa que pertenezca al equipo del área de este resultado clave."
        : "El responsable debe ser un usuario activo de la misma empresa.",
    };
  }

  const prev = await prisma.activity.findUnique({
    where: { id: activityId },
    select: {
      status: true,
      progressContribution: true,
      impactsProgress: true,
      actualStartDate: true,
      actualEndDate: true,
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

  const finalImpacts = kr.allowActivityImpact ? normalized.impactsProgress : false;

  const weightOutcome = resolvePersistedContributionWeight({
    raw: d.contributionWeight,
    impactsProgress: finalImpacts,
    allowActivityImpact: kr.allowActivityImpact,
    progressMode: kr.progressMode,
  });
  if (weightOutcome.fieldError) {
    return {
      ok: false,
      message: "Revisá el peso de impacto.",
      fieldErrors: { contributionWeight: [weightOutcome.fieldError] },
    };
  }

  const depRes = await validateDependsOnInput({
    companyId: kr.companyId,
    editingActivityId: activityId,
    dependsOnActivityId: d.dependsOnActivityId,
  });
  if (!depRes.ok) {
    return {
      ok: false,
      message: depRes.message,
      fieldErrors: depRes.fieldErrors,
    };
  }

  const depGate = assertCanStartOrProgress({
    dependsOnActivityId: d.dependsOnActivityId ?? null,
    predecessorStatus: depRes.predecessorStatus,
    effectiveStatus,
    progressPercent: normalized.progress,
  });
  if (!depGate.ok) {
    return { ok: false, message: depGate.message };
  }

  const setActualStart = shouldSetActualStartDate({
    previousActualStart: prev?.actualStartDate ?? null,
    dependsOnActivityId: d.dependsOnActivityId ?? null,
    predecessorStatus: depRes.predecessorStatus,
    effectiveStatus,
    progressPercent: normalized.progress,
  });
  const actualEndUpdate = resolveActualEndDateBehavior({
    previousActualEndDate: prev?.actualEndDate ?? null,
    effectiveStatus,
  });

  await prisma.activity.update({
    where: { id: activityId },
    data: {
      title: d.title,
      description: d.description ?? null,
      assigneeUserId: d.assigneeUserId ?? null,
      startDate,
      dueDate,
      dependsOnActivityId: d.dependsOnActivityId ?? null,
      ...(setActualStart ? { actualStartDate: utcTodayStart() } : {}),
      ...(actualEndUpdate ?? {}),
      status: effectiveStatus,
      impactsProgress: finalImpacts,
      contributionWeight: weightOutcome.decimal,
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
      contributionWeight: true,
      dependsOnActivityId: true,
      actualStartDate: true,
      actualEndDate: true,
      keyResult: { select: { allowActivityImpact: true } },
      dependsOnActivity: { select: { status: true } },
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

  const predStatus = existing.dependsOnActivityId
    ? (existing.dependsOnActivity?.status ?? null)
    : null;
  const depGate = assertCanStartOrProgress({
    dependsOnActivityId: existing.dependsOnActivityId,
    predecessorStatus: predStatus,
    effectiveStatus,
    progressPercent: normalized.progress,
  });
  if (!depGate.ok) {
    return { ok: false, message: depGate.message };
  }

  const finalImpacts = existing.keyResult.allowActivityImpact ? normalized.impactsProgress : false;
  const prevW = Number(existing.contributionWeight);

  const noStatusChange = existing.status === effectiveStatus;
  const noProgressChange = prevP === normalized.progress;
  const noImpactChange = existing.impactsProgress === finalImpacts;
  const needsWeightZero = !finalImpacts && prevW !== 0;
  const setActualStart = shouldSetActualStartDate({
    previousActualStart: existing.actualStartDate,
    dependsOnActivityId: existing.dependsOnActivityId,
    predecessorStatus: predStatus,
    effectiveStatus,
    progressPercent: normalized.progress,
  });
  const actualEndUpdate = resolveActualEndDateBehavior({
    previousActualEndDate: existing.actualEndDate,
    effectiveStatus,
  });
  if (
    noStatusChange &&
    noProgressChange &&
    noImpactChange &&
    !needsWeightZero &&
    !setActualStart &&
    !actualEndUpdate
  ) {
    return { ok: false, message: "No hay cambios para guardar" };
  }

  await prisma.activity.update({
    where: { id: activityId },
    data: {
      status: effectiveStatus,
      impactsProgress: finalImpacts,
      ...(finalImpacts ? {} : { contributionWeight: new Prisma.Decimal(0) }),
      ...(setActualStart ? { actualStartDate: utcTodayStart() } : {}),
      ...(actualEndUpdate ?? {}),
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
      contributionWeight: true,
      dependsOnActivityId: true,
      actualStartDate: true,
      actualEndDate: true,
      keyResult: { select: { allowActivityImpact: true } },
      dependsOnActivity: { select: { status: true } },
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

  const predStatus = row.dependsOnActivityId ? (row.dependsOnActivity?.status ?? null) : null;
  const depGate = assertCanStartOrProgress({
    dependsOnActivityId: row.dependsOnActivityId,
    predecessorStatus: predStatus,
    effectiveStatus: status,
    progressPercent: normalized.progress,
  });
  if (!depGate.ok) {
    return { ok: false, message: depGate.message };
  }

  const finalImpacts = row.keyResult.allowActivityImpact ? normalized.impactsProgress : false;

  const setActualStart = shouldSetActualStartDate({
    previousActualStart: row.actualStartDate,
    dependsOnActivityId: row.dependsOnActivityId,
    predecessorStatus: predStatus,
    effectiveStatus: status,
    progressPercent: normalized.progress,
  });
  const actualEndUpdate = resolveActualEndDateBehavior({
    previousActualEndDate: row.actualEndDate,
    effectiveStatus: status,
  });

  await prisma.activity.update({
    where: { id: activityId },
    data: {
      status,
      impactsProgress: finalImpacts,
      ...(finalImpacts ? {} : { contributionWeight: new Prisma.Decimal(0) }),
      ...(setActualStart ? { actualStartDate: utcTodayStart() } : {}),
      ...(actualEndUpdate ?? {}),
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
