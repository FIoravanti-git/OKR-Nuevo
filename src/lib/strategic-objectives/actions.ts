"use server";

import { Prisma } from "@/generated/prisma";
import type { StrategicObjectiveStatus } from "@/generated/prisma";
import { requireSessionUser } from "@/lib/auth/session-user";
import { prisma } from "@/lib/prisma";
import { revalidateOkrHierarchyPaths } from "@/lib/okr/revalidate-okr-paths";
import { syncInstitutionalObjectiveProgressFromStrategicChildren } from "@/lib/okr/sync-institutional-objective-progress";
import { syncKeyResultProgress } from "@/lib/okr/sync-key-result-progress";
import { syncStrategicObjectiveProgressFromKeyResults } from "@/lib/okr/sync-strategic-objective-progress";
import { isAreaInCompany } from "@/lib/areas/validate-area-company";
import {
  canMutateStrategicObjective,
  canMutateStrategicObjectives,
  canViewStrategicObjective,
} from "@/lib/strategic-objectives/policy";
import { strategicObjectiveFormSchema, strategicObjectiveStatusSchema } from "@/lib/strategic-objectives/schemas";

export type StrategicObjectiveActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

async function rollupParentInstitutional(institutionalObjectiveId: string) {
  await syncInstitutionalObjectiveProgressFromStrategicChildren(institutionalObjectiveId);
}

export async function createStrategicObjective(input: unknown): Promise<StrategicObjectiveActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateStrategicObjectives(actor)) {
    return { ok: false, message: "No tenés permiso para crear objetivos clave." };
  }

  const parsed = strategicObjectiveFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá los campos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const parent = await prisma.institutionalObjective.findUnique({
    where: { id: parsed.data.institutionalObjectiveId },
  });

  if (!parent) {
    return { ok: false, message: "El objetivo institucional no existe." };
  }

  if (!canMutateStrategicObjective(actor, parent.companyId)) {
    return { ok: false, message: "No podés crear objetivos clave para ese objetivo institucional." };
  }

  const { title, description, weight, sortOrder, institutionalObjectiveId, status, areaId } = parsed.data;

  const okArea = await isAreaInCompany(areaId, parent.companyId);
  if (!okArea) {
    return {
      ok: false,
      message: "El área no pertenece a la empresa del objetivo institucional.",
      fieldErrors: { areaId: ["Área no válida"] },
    };
  }

  await prisma.strategicObjective.create({
    data: {
      companyId: parent.companyId,
      institutionalObjectiveId,
      title,
      description: description ?? null,
      weight: new Prisma.Decimal(String(weight)),
      sortOrder,
      status,
      progressCached: null,
      areaId,
    },
  });

  await rollupParentInstitutional(institutionalObjectiveId);

  await revalidateOkrHierarchyPaths({ institutionalObjectiveId });
  return { ok: true };
}

export async function updateStrategicObjective(
  strategicId: string,
  input: unknown
): Promise<StrategicObjectiveActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateStrategicObjectives(actor)) {
    return { ok: false, message: "No tenés permiso para editar objetivos clave." };
  }

  const existing = await prisma.strategicObjective.findUnique({
    where: { id: strategicId },
  });

  if (!existing) {
    return { ok: false, message: "Objetivo clave no encontrado." };
  }

  if (!canViewStrategicObjective(actor, existing.companyId)) {
    return { ok: false, message: "No tenés acceso a este objetivo." };
  }

  if (!canMutateStrategicObjective(actor, existing.companyId)) {
    return { ok: false, message: "No podés modificar este objetivo." };
  }

  const parsed = strategicObjectiveFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá los campos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  if (parsed.data.institutionalObjectiveId !== existing.institutionalObjectiveId) {
    return { ok: false, message: "No se puede cambiar el objetivo institucional asociado." };
  }

  const { title, description, weight, sortOrder, status, areaId } = parsed.data;

  const okArea = await isAreaInCompany(areaId, existing.companyId);
  if (!okArea) {
    return {
      ok: false,
      message: "El área no pertenece a esta empresa.",
      fieldErrors: { areaId: ["Área no válida"] },
    };
  }

  await prisma.strategicObjective.update({
    where: { id: strategicId },
    data: {
      title,
      description: description ?? null,
      weight: new Prisma.Decimal(String(weight)),
      sortOrder,
      status,
      areaId,
    },
  });

  await prisma.keyResult.updateMany({
    where: { strategicObjectiveId: strategicId },
    data: { areaId },
  });

  await syncStrategicObjectiveProgressFromKeyResults(strategicId);
  await rollupParentInstitutional(existing.institutionalObjectiveId);

  await revalidateOkrHierarchyPaths({
    institutionalObjectiveId: existing.institutionalObjectiveId,
    strategicObjectiveId: strategicId,
  });
  return { ok: true };
}

export async function setStrategicObjectiveStatus(
  strategicId: string,
  statusRaw: unknown
): Promise<StrategicObjectiveActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateStrategicObjectives(actor)) {
    return { ok: false, message: "No tenés permiso para cambiar el estado." };
  }

  const st = strategicObjectiveStatusSchema.safeParse(statusRaw);
  if (!st.success) {
    return { ok: false, message: "Estado no válido." };
  }

  const status = st.data as StrategicObjectiveStatus;

  const row = await prisma.strategicObjective.findUnique({ where: { id: strategicId } });
  if (!row) {
    return { ok: false, message: "Objetivo clave no encontrado." };
  }

  if (!canMutateStrategicObjective(actor, row.companyId)) {
    return { ok: false, message: "No podés modificar este objetivo." };
  }

  await prisma.strategicObjective.update({
    where: { id: strategicId },
    data: { status },
  });

  await syncStrategicObjectiveProgressFromKeyResults(strategicId);
  await rollupParentInstitutional(row.institutionalObjectiveId);

  await revalidateOkrHierarchyPaths({
    institutionalObjectiveId: row.institutionalObjectiveId,
    strategicObjectiveId: strategicId,
  });
  return { ok: true };
}

export async function recalculateStrategicObjectiveProgress(
  strategicId: string
): Promise<StrategicObjectiveActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateStrategicObjectives(actor)) {
    return { ok: false, message: "No tenés permiso para recalcular el progreso." };
  }

  const row = await prisma.strategicObjective.findUnique({ where: { id: strategicId } });
  if (!row) {
    return { ok: false, message: "Objetivo clave no encontrado." };
  }

  if (!canMutateStrategicObjective(actor, row.companyId)) {
    return { ok: false, message: "No podés modificar este objetivo." };
  }

  const krIds = await prisma.keyResult.findMany({
    where: { strategicObjectiveId: strategicId },
    select: { id: true },
  });
  for (const k of krIds) {
    await syncKeyResultProgress(k.id);
  }

  await syncStrategicObjectiveProgressFromKeyResults(strategicId);
  await rollupParentInstitutional(row.institutionalObjectiveId);

  await revalidateOkrHierarchyPaths({
    institutionalObjectiveId: row.institutionalObjectiveId,
    strategicObjectiveId: strategicId,
  });
  return { ok: true };
}

export async function deleteStrategicObjective(strategicId: string): Promise<StrategicObjectiveActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateStrategicObjectives(actor)) {
    return { ok: false, message: "No tenés permiso para eliminar objetivos clave." };
  }

  const row = await prisma.strategicObjective.findUnique({ where: { id: strategicId } });
  if (!row) {
    return { ok: false, message: "Objetivo clave no encontrado." };
  }

  if (!canMutateStrategicObjective(actor, row.companyId)) {
    return { ok: false, message: "No podés eliminar este objetivo." };
  }

  const parentId = row.institutionalObjectiveId;

  await prisma.strategicObjective.delete({ where: { id: strategicId } });

  await rollupParentInstitutional(parentId);

  await revalidateOkrHierarchyPaths({ institutionalObjectiveId: parentId });
  return { ok: true };
}
