"use server";

import { Prisma } from "@/generated/prisma";
import type { KeyResultStatus } from "@/generated/prisma";
import { requireSessionUser } from "@/lib/auth/session-user";
import {
  canMutateKeyResult,
  canMutateKeyResults,
  canViewKeyResult,
} from "@/lib/key-results/policy";
import { tryAppendKeyResultProgressLog } from "@/lib/key-results/key-result-progress-log";
import {
  keyResultFormSchema,
  keyResultMetricCurrentValueQuickSchema,
  keyResultManualProgressSchema,
  keyResultStatusSchema,
} from "@/lib/key-results/schemas";
import { rollupKeyResultChainFromKeyResultId } from "@/lib/okr/rollup-key-result-chain";
import { revalidateOkrHierarchyPaths } from "@/lib/okr/revalidate-okr-paths";
import { syncInstitutionalObjectiveProgressFromStrategicChildren } from "@/lib/okr/sync-institutional-objective-progress";
import { syncStrategicObjectiveProgressFromKeyResults } from "@/lib/okr/sync-strategic-objective-progress";
import { prisma } from "@/lib/prisma";

export type KeyResultActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export type KeyResultQuickMetricUpdateResult =
  | {
      ok: true;
      row: {
        id: string;
        currentValue: number | null;
        progressCached: number | null;
        status: KeyResultStatus;
      };
    }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

async function rollupAncestors(strategicObjectiveId: string) {
  const s = await prisma.strategicObjective.findUnique({
    where: { id: strategicObjectiveId },
    select: { institutionalObjectiveId: true },
  });
  if (!s) return;
  await syncStrategicObjectiveProgressFromKeyResults(strategicObjectiveId);
  await syncInstitutionalObjectiveProgressFromStrategicChildren(s.institutionalObjectiveId);
}

export async function createKeyResult(input: unknown): Promise<KeyResultActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateKeyResults(actor)) {
    return { ok: false, message: "No tenés permiso para crear resultados clave." };
  }

  const parsed = keyResultFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá los campos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const parent = await prisma.strategicObjective.findUnique({
    where: { id: parsed.data.strategicObjectiveId },
    select: { companyId: true, institutionalObjectiveId: true, areaId: true },
  });

  if (!parent) {
    return { ok: false, message: "El objetivo clave no existe." };
  }

  if (!canMutateKeyResult(actor, parent.companyId)) {
    return { ok: false, message: "No podés crear resultados clave para ese objetivo." };
  }

  if (!parent.areaId) {
    return {
      ok: false,
      message: "El objetivo clave debe tener un área asignada. Asignala en Objetivos clave y volvé a intentar.",
    };
  }

  const d = parsed.data;
  const progressCached =
    d.calculationMode === "MANUAL" && d.manualProgress != null
      ? new Prisma.Decimal(Number(d.manualProgress.toFixed(2)))
      : null;

  const created = await prisma.keyResult.create({
    data: {
      companyId: parent.companyId,
      strategicObjectiveId: d.strategicObjectiveId,
      title: d.title,
      description: d.description ?? null,
      metricType: d.metricType,
      weight: new Prisma.Decimal(String(d.weight)),
      sortOrder: d.sortOrder,
      status: d.status,
      unit: d.unit ?? null,
      initialValue:
        d.initialValue !== undefined ? new Prisma.Decimal(String(d.initialValue)) : null,
      targetValue: d.targetValue !== undefined ? new Prisma.Decimal(String(d.targetValue)) : null,
      currentValue: d.currentValue !== undefined ? new Prisma.Decimal(String(d.currentValue)) : null,
      targetDirection: d.targetDirection,
      calculationMode: d.calculationMode,
      progressMode: d.progressMode,
      allowActivityImpact: d.allowActivityImpact,
      progressCached,
      areaId: parent.areaId,
    },
  });

  await rollupKeyResultChainFromKeyResultId(created.id);
  await revalidateOkrHierarchyPaths({
    institutionalObjectiveId: parent.institutionalObjectiveId,
    strategicObjectiveId: d.strategicObjectiveId,
    keyResultId: created.id,
  });

  return { ok: true };
}

export async function updateKeyResult(krId: string, input: unknown): Promise<KeyResultActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateKeyResults(actor)) {
    return { ok: false, message: "No tenés permiso para editar resultados clave." };
  }

  const existing = await prisma.keyResult.findUnique({
    where: { id: krId },
    include: {
      strategicObjective: { select: { institutionalObjectiveId: true, areaId: true } },
    },
  });

  if (!existing) {
    return { ok: false, message: "Resultado clave no encontrado." };
  }

  if (!canViewKeyResult(actor, existing.companyId)) {
    return { ok: false, message: "No tenés acceso a este resultado." };
  }

  if (!canMutateKeyResult(actor, existing.companyId)) {
    return { ok: false, message: "No podés modificar este resultado." };
  }

  const parsed = keyResultFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá los campos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  if (parsed.data.strategicObjectiveId !== existing.strategicObjectiveId) {
    return { ok: false, message: "No se puede cambiar el objetivo clave asociado." };
  }

  const d = parsed.data;

  const soAreaId = existing.strategicObjective.areaId;
  if (!soAreaId) {
    return {
      ok: false,
      message: "El objetivo clave padre debe tener un área asignada. Corregilo en Objetivos clave.",
    };
  }

  const ioId = existing.strategicObjective.institutionalObjectiveId;

  const beforeSnap = {
    progressCached: existing.progressCached,
    currentValue: existing.currentValue,
    status: existing.status,
  };

  const progressUpdate =
    d.calculationMode === "MANUAL" && d.manualProgress != null
      ? new Prisma.Decimal(Number(d.manualProgress.toFixed(2)))
      : undefined;

  await prisma.keyResult.update({
    where: { id: krId },
    data: {
      title: d.title,
      description: d.description ?? null,
      metricType: d.metricType,
      weight: new Prisma.Decimal(String(d.weight)),
      sortOrder: d.sortOrder,
      status: d.status,
      unit: d.unit ?? null,
      initialValue:
        d.initialValue !== undefined ? new Prisma.Decimal(String(d.initialValue)) : null,
      targetValue: d.targetValue !== undefined ? new Prisma.Decimal(String(d.targetValue)) : null,
      currentValue: d.currentValue !== undefined ? new Prisma.Decimal(String(d.currentValue)) : null,
      targetDirection: d.targetDirection,
      calculationMode: d.calculationMode,
      progressMode: d.progressMode,
      allowActivityImpact: d.allowActivityImpact,
      areaId: soAreaId,
      ...(progressUpdate !== undefined ? { progressCached: progressUpdate } : {}),
    },
  });

  await rollupKeyResultChainFromKeyResultId(krId);

  const afterRow = await prisma.keyResult.findUnique({
    where: { id: krId },
    select: { progressCached: true, currentValue: true, status: true },
  });

  if (afterRow) {
    await tryAppendKeyResultProgressLog({
      companyId: existing.companyId,
      keyResultId: krId,
      actorId: actor.id,
      source: "FORM_SAVE",
      note: d.progressChangeNote ?? null,
      before: beforeSnap,
      after: {
        progressCached: afterRow.progressCached,
        currentValue: afterRow.currentValue,
        status: afterRow.status,
      },
    });
  }

  await revalidateOkrHierarchyPaths({
    institutionalObjectiveId: ioId,
    strategicObjectiveId: d.strategicObjectiveId,
    keyResultId: krId,
  });

  return { ok: true };
}

function parseOptionalProgressNote(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (t === "") return null;
  return t.length > 2000 ? t.slice(0, 2000) : t;
}

function parseProgressInput(raw: string): number {
  return Number(Number(raw.trim().replace(",", ".")).toFixed(2));
}

function parseCurrentValueInput(raw: string): number {
  return Number(Number(raw.trim().replace(",", ".")).toFixed(6));
}

function deriveStatusFromProgressForQuickUpdate(
  currentStatus: KeyResultStatus,
  progress: number | null
): KeyResultStatus {
  if (currentStatus === "CANCELLED") return "CANCELLED";
  if (progress == null || Number.isNaN(progress)) return "DRAFT";
  if (progress >= 100) return "COMPLETED";
  if (progress < 30) return "AT_RISK";
  return "ON_TRACK";
}

export async function updateKeyResultManualProgressSnapshot(
  krId: string,
  input: unknown
): Promise<KeyResultActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateKeyResults(actor)) {
    return { ok: false, message: "No tenés permiso para actualizar el avance." };
  }

  const parsed = keyResultManualProgressSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá los campos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const row = await prisma.keyResult.findUnique({
    where: { id: krId },
    include: { strategicObjective: { select: { institutionalObjectiveId: true } } },
  });
  if (!row) {
    return { ok: false, message: "Resultado clave no encontrado." };
  }

  if (!canMutateKeyResult(actor, row.companyId)) {
    return { ok: false, message: "No podés modificar este resultado." };
  }

  if (row.calculationMode !== "MANUAL") {
    return {
      ok: false,
      message: "Este KR no es manual. El avance se calcula automáticamente por su modo de cálculo.",
    };
  }

  const prevP = row.progressCached != null ? Number(row.progressCached) : null;
  const newP = parseProgressInput(parsed.data.progressInput);
  const note = parseOptionalProgressNote(parsed.data.observation);

  if (prevP === newP) {
    return { ok: false, message: "No hay cambios para guardar" };
  }

  const beforeSnap = {
    progressCached: row.progressCached,
    currentValue: row.currentValue,
    status: row.status,
  };

  await prisma.keyResult.update({
    where: { id: krId },
    data: {
      progressCached: new Prisma.Decimal(newP.toFixed(2)),
    },
  });

  await rollupKeyResultChainFromKeyResultId(krId);

  const afterRow = await prisma.keyResult.findUnique({
    where: { id: krId },
    select: { progressCached: true, currentValue: true, status: true },
  });

  if (afterRow) {
    await tryAppendKeyResultProgressLog({
      companyId: row.companyId,
      keyResultId: krId,
      actorId: actor.id,
      source: "FORM_SAVE",
      note,
      before: beforeSnap,
      after: {
        progressCached: afterRow.progressCached,
        currentValue: afterRow.currentValue,
        status: afterRow.status,
      },
    });
  }

  await revalidateOkrHierarchyPaths({
    institutionalObjectiveId: row.strategicObjective.institutionalObjectiveId,
    strategicObjectiveId: row.strategicObjectiveId,
    keyResultId: krId,
  });

  return { ok: true };
}

export async function updateKeyResultCurrentMetricSnapshot(
  krId: string,
  input: unknown
): Promise<KeyResultQuickMetricUpdateResult> {
  const actor = await requireSessionUser();

  if (!canMutateKeyResults(actor)) {
    return { ok: false, message: "No tenés permiso para actualizar la métrica." };
  }

  const parsed = keyResultMetricCurrentValueQuickSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá los campos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const row = await prisma.keyResult.findUnique({
    where: { id: krId },
    include: { strategicObjective: { select: { institutionalObjectiveId: true } } },
  });
  if (!row) {
    return { ok: false, message: "Resultado clave no encontrado." };
  }

  if (!canMutateKeyResult(actor, row.companyId)) {
    return { ok: false, message: "No podés modificar este resultado." };
  }

  if (row.calculationMode === "MANUAL") {
    return {
      ok: false,
      message: "Esta acción aplica solo a KRs automáticos o híbridos.",
    };
  }

  const newCurrentValue = parseCurrentValueInput(parsed.data.currentValueInput);
  if (row.metricType === "COUNT" && !Number.isInteger(newCurrentValue)) {
    return { ok: false, message: "Para tipo Conteo debés ingresar un número entero." };
  }
  if (row.metricType === "PERCENT" && (newCurrentValue < 0 || newCurrentValue > 100)) {
    return { ok: false, message: "Para porcentaje el valor actual debe estar entre 0 y 100." };
  }
  const prevCurrentValue = row.currentValue != null ? Number(row.currentValue) : null;
  if (prevCurrentValue === newCurrentValue) {
    return { ok: false, message: "No hay cambios para guardar" };
  }

  const beforeSnap = {
    progressCached: row.progressCached,
    currentValue: row.currentValue,
    status: row.status,
  };

  await prisma.keyResult.update({
    where: { id: krId },
    data: {
      currentValue: new Prisma.Decimal(newCurrentValue.toFixed(6)),
    },
  });

  await rollupKeyResultChainFromKeyResultId(krId);

  const afterProgress = await prisma.keyResult.findUnique({
    where: { id: krId },
    select: {
      progressCached: true,
      currentValue: true,
      status: true,
    },
  });
  if (!afterProgress) {
    return { ok: false, message: "No se pudo obtener el resultado actualizado." };
  }

  const computedProgress =
    afterProgress.progressCached != null ? Number(afterProgress.progressCached) : null;
  const computedStatus = deriveStatusFromProgressForQuickUpdate(row.status, computedProgress);

  if (computedStatus !== afterProgress.status) {
    await prisma.keyResult.update({
      where: { id: krId },
      data: { status: computedStatus },
    });
  }

  const afterRow = await prisma.keyResult.findUnique({
    where: { id: krId },
    select: { progressCached: true, currentValue: true, status: true },
  });
  if (!afterRow) {
    return { ok: false, message: "No se pudo obtener el resultado actualizado." };
  }

  await tryAppendKeyResultProgressLog({
    companyId: row.companyId,
    keyResultId: krId,
    actorId: actor.id,
    source: "FORM_SAVE",
    note: parseOptionalProgressNote(parsed.data.observation),
    before: beforeSnap,
    after: {
      progressCached: afterRow.progressCached,
      currentValue: afterRow.currentValue,
      status: afterRow.status,
    },
  });

  await revalidateOkrHierarchyPaths({
    institutionalObjectiveId: row.strategicObjective.institutionalObjectiveId,
    strategicObjectiveId: row.strategicObjectiveId,
    keyResultId: krId,
  });

  return {
    ok: true,
    row: {
      id: krId,
      currentValue: afterRow.currentValue != null ? Number(afterRow.currentValue) : null,
      progressCached: afterRow.progressCached != null ? Number(afterRow.progressCached) : null,
      status: afterRow.status,
    },
  };
}

/** `status` como string enum, o `{ status, note? }` desde la UI. */
export async function setKeyResultStatus(
  krId: string,
  statusRaw: unknown,
  noteRaw?: unknown
): Promise<KeyResultActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateKeyResults(actor)) {
    return { ok: false, message: "No tenés permiso para cambiar el estado." };
  }

  let status: KeyResultStatus;
  let note: string | null = null;
  if (statusRaw != null && typeof statusRaw === "object" && "status" in statusRaw) {
    const st = keyResultStatusSchema.safeParse((statusRaw as { status: unknown }).status);
    if (!st.success) {
      return { ok: false, message: "Estado no válido." };
    }
    status = st.data as KeyResultStatus;
    note =
      parseOptionalProgressNote((statusRaw as { note?: unknown }).note) ??
      parseOptionalProgressNote(noteRaw);
  } else {
    const st = keyResultStatusSchema.safeParse(statusRaw);
    if (!st.success) {
      return { ok: false, message: "Estado no válido." };
    }
    status = st.data as KeyResultStatus;
    note = parseOptionalProgressNote(noteRaw);
  }

  const row = await prisma.keyResult.findUnique({
    where: { id: krId },
    include: { strategicObjective: { select: { institutionalObjectiveId: true } } },
  });
  if (!row) {
    return { ok: false, message: "Resultado clave no encontrado." };
  }

  if (!canMutateKeyResult(actor, row.companyId)) {
    return { ok: false, message: "No podés modificar este resultado." };
  }

  const beforeSnap = {
    progressCached: row.progressCached,
    currentValue: row.currentValue,
    status: row.status,
  };

  await prisma.keyResult.update({
    where: { id: krId },
    data: { status },
  });

  await rollupKeyResultChainFromKeyResultId(krId);

  const afterRow = await prisma.keyResult.findUnique({
    where: { id: krId },
    select: { progressCached: true, currentValue: true, status: true },
  });

  if (afterRow) {
    await tryAppendKeyResultProgressLog({
      companyId: row.companyId,
      keyResultId: krId,
      actorId: actor.id,
      source: "STATUS_CHANGE",
      note,
      before: beforeSnap,
      after: {
        progressCached: afterRow.progressCached,
        currentValue: afterRow.currentValue,
        status: afterRow.status,
      },
    });
  }

  await revalidateOkrHierarchyPaths({
    institutionalObjectiveId: row.strategicObjective.institutionalObjectiveId,
    strategicObjectiveId: row.strategicObjectiveId,
    keyResultId: krId,
  });

  return { ok: true };
}

export async function recalculateKeyResultProgress(
  krId: string,
  noteRaw?: unknown
): Promise<KeyResultActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateKeyResults(actor)) {
    return { ok: false, message: "No tenés permiso para recalcular el progreso." };
  }

  const row = await prisma.keyResult.findUnique({
    where: { id: krId },
    include: { strategicObjective: { select: { institutionalObjectiveId: true } } },
  });
  if (!row) {
    return { ok: false, message: "Resultado clave no encontrado." };
  }

  if (!canMutateKeyResult(actor, row.companyId)) {
    return { ok: false, message: "No podés modificar este resultado." };
  }

  if (row.calculationMode === "MANUAL") {
    return { ok: false, message: "En modo manual el progreso no se recalcula automáticamente." };
  }

  const beforeSnap = {
    progressCached: row.progressCached,
    currentValue: row.currentValue,
    status: row.status,
  };

  await rollupKeyResultChainFromKeyResultId(krId);

  const afterRow = await prisma.keyResult.findUnique({
    where: { id: krId },
    select: { progressCached: true, currentValue: true, status: true },
  });

  if (afterRow) {
    await tryAppendKeyResultProgressLog({
      companyId: row.companyId,
      keyResultId: krId,
      actorId: actor.id,
      source: "RECALCULATE",
      note: parseOptionalProgressNote(noteRaw),
      before: beforeSnap,
      after: {
        progressCached: afterRow.progressCached,
        currentValue: afterRow.currentValue,
        status: afterRow.status,
      },
    });
  }

  await revalidateOkrHierarchyPaths({
    institutionalObjectiveId: row.strategicObjective.institutionalObjectiveId,
    strategicObjectiveId: row.strategicObjectiveId,
    keyResultId: krId,
  });

  return { ok: true };
}

export async function deleteKeyResult(krId: string): Promise<KeyResultActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateKeyResults(actor)) {
    return { ok: false, message: "No tenés permiso para eliminar resultados clave." };
  }

  const row = await prisma.keyResult.findUnique({
    where: { id: krId },
    include: { strategicObjective: { select: { institutionalObjectiveId: true } } },
  });
  if (!row) {
    return { ok: false, message: "Resultado clave no encontrado." };
  }

  if (!canMutateKeyResult(actor, row.companyId)) {
    return { ok: false, message: "No podés eliminar este resultado." };
  }

  const strategicObjectiveId = row.strategicObjectiveId;
  const ioId = row.strategicObjective.institutionalObjectiveId;

  await prisma.keyResult.delete({ where: { id: krId } });

  await rollupAncestors(strategicObjectiveId);
  await revalidateOkrHierarchyPaths({
    institutionalObjectiveId: ioId,
    strategicObjectiveId,
  });

  return { ok: true };
}
