"use server";

import { Prisma } from "@/generated/prisma";
import type { InstitutionalObjectiveStatus } from "@/generated/prisma";
import { requireSessionUser } from "@/lib/auth/session-user";
import { prisma } from "@/lib/prisma";
import {
  canMutateInstitutionalObjective,
  canMutateInstitutionalObjectives,
  canViewInstitutionalObjective,
} from "@/lib/institutional-objectives/policy";
import {
  institutionalObjectiveFormSchema,
  institutionalObjectiveStatusSchema,
} from "@/lib/institutional-objectives/schemas";
import { revalidateInstitutionalObjectiveScope } from "@/lib/okr/revalidate-okr-paths";
import {
  syncInstitutionalObjectiveProgressFromStrategicChildren,
  syncInstitutionalObjectiveProgressFromStrategicChildrenDeep,
} from "@/lib/okr/sync-institutional-objective-progress";
import { syncInstitutionalProjectProgressFromObjectives } from "@/lib/okr/sync-institutional-project-progress";

export type InstitutionalObjectiveActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function createInstitutionalObjective(input: unknown): Promise<InstitutionalObjectiveActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateInstitutionalObjectives(actor)) {
    return { ok: false, message: "No tenés permiso para crear objetivos institucionales." };
  }

  const parsed = institutionalObjectiveFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá los campos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const project = await prisma.institutionalProject.findUnique({
    where: { id: parsed.data.institutionalProjectId },
  });

  if (!project) {
    return { ok: false, message: "El proyecto institucional no existe." };
  }

  if (!canMutateInstitutionalObjective(actor, project.companyId)) {
    return { ok: false, message: "No podés crear objetivos para ese proyecto." };
  }

  const { title, description, weight, sortOrder, institutionalProjectId, status } = parsed.data;

  const created = await prisma.institutionalObjective.create({
    data: {
      companyId: project.companyId,
      institutionalProjectId,
      title,
      description: description ?? null,
      weight: new Prisma.Decimal(String(weight)),
      sortOrder,
      status,
      progressCached: null,
    },
  });

  await syncInstitutionalProjectProgressFromObjectives(institutionalProjectId);

  await revalidateInstitutionalObjectiveScope(created.id, institutionalProjectId);
  return { ok: true };
}

export async function updateInstitutionalObjective(
  objectiveId: string,
  input: unknown
): Promise<InstitutionalObjectiveActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateInstitutionalObjectives(actor)) {
    return { ok: false, message: "No tenés permiso para editar objetivos." };
  }

  const existing = await prisma.institutionalObjective.findUnique({
    where: { id: objectiveId },
  });

  if (!existing) {
    return { ok: false, message: "Objetivo no encontrado." };
  }

  if (!canViewInstitutionalObjective(actor, existing.companyId)) {
    return { ok: false, message: "No tenés acceso a este objetivo." };
  }

  if (!canMutateInstitutionalObjective(actor, existing.companyId)) {
    return { ok: false, message: "No podés modificar este objetivo." };
  }

  const parsed = institutionalObjectiveFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá los campos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  if (parsed.data.institutionalProjectId !== existing.institutionalProjectId) {
    return { ok: false, message: "No se puede cambiar el proyecto institucional asociado." };
  }

  const { title, description, weight, sortOrder, status } = parsed.data;

  await prisma.institutionalObjective.update({
    where: { id: objectiveId },
    data: {
      title,
      description: description ?? null,
      weight: new Prisma.Decimal(String(weight)),
      sortOrder,
      status,
    },
  });

  await syncInstitutionalObjectiveProgressFromStrategicChildren(objectiveId);

  await revalidateInstitutionalObjectiveScope(objectiveId, existing.institutionalProjectId);
  return { ok: true };
}

export async function setInstitutionalObjectiveStatus(
  objectiveId: string,
  statusRaw: unknown
): Promise<InstitutionalObjectiveActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateInstitutionalObjectives(actor)) {
    return { ok: false, message: "No tenés permiso para cambiar el estado." };
  }

  const st = institutionalObjectiveStatusSchema.safeParse(statusRaw);
  if (!st.success) {
    return { ok: false, message: "Estado no válido." };
  }

  const status = st.data as InstitutionalObjectiveStatus;

  const existing = await prisma.institutionalObjective.findUnique({ where: { id: objectiveId } });
  if (!existing) {
    return { ok: false, message: "Objetivo no encontrado." };
  }

  if (!canMutateInstitutionalObjective(actor, existing.companyId)) {
    return { ok: false, message: "No podés modificar este objetivo." };
  }

  await prisma.institutionalObjective.update({
    where: { id: objectiveId },
    data: { status },
  });

  await syncInstitutionalObjectiveProgressFromStrategicChildren(objectiveId);

  await revalidateInstitutionalObjectiveScope(objectiveId, existing.institutionalProjectId);
  return { ok: true };
}

export async function recalculateInstitutionalObjectiveProgress(
  objectiveId: string
): Promise<InstitutionalObjectiveActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateInstitutionalObjectives(actor)) {
    return { ok: false, message: "No tenés permiso para recalcular el progreso." };
  }

  const existing = await prisma.institutionalObjective.findUnique({ where: { id: objectiveId } });
  if (!existing) {
    return { ok: false, message: "Objetivo no encontrado." };
  }

  if (!canMutateInstitutionalObjective(actor, existing.companyId)) {
    return { ok: false, message: "No podés modificar este objetivo." };
  }

  await syncInstitutionalObjectiveProgressFromStrategicChildrenDeep(objectiveId);

  await revalidateInstitutionalObjectiveScope(objectiveId, existing.institutionalProjectId);
  return { ok: true };
}
