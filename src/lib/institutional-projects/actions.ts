"use server";

import { revalidatePath } from "next/cache";
import type { InstitutionalProjectStatus } from "@/generated/prisma";
import { requireSessionUser } from "@/lib/auth/session-user";
import { prisma } from "@/lib/prisma";
import {
  canMutateInstitutionalProject,
  canMutateInstitutionalProjects,
  resolvedCompanyIdForProjectCreate,
} from "@/lib/institutional-projects/policy";
import {
  institutionalProjectFormSchema,
  institutionalProjectStatusSchema,
} from "@/lib/institutional-projects/schemas";

export type InstitutionalProjectActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function createInstitutionalProject(input: unknown): Promise<InstitutionalProjectActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateInstitutionalProjects(actor)) {
    return { ok: false, message: "No tenés permiso para crear proyectos institucionales." };
  }

  const parsed = institutionalProjectFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá los campos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const companyId = resolvedCompanyIdForProjectCreate(actor, parsed.data.companyId);
  if (!companyId) {
    return {
      ok: false,
      message: "Debés seleccionar una empresa.",
      fieldErrors: { companyId: ["Requerido"] },
    };
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    return { ok: false, message: "La empresa indicada no existe." };
  }

  const { title, description, mission, vision, year, methodology, status } = parsed.data;

  await prisma.institutionalProject.create({
    data: {
      companyId,
      title,
      description: description ?? null,
      mission: mission ?? null,
      vision: vision ?? null,
      year: year ?? null,
      methodology: methodology ?? null,
      status,
    },
  });

  revalidatePath("/proyecto");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateInstitutionalProject(
  projectId: string,
  input: unknown
): Promise<InstitutionalProjectActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateInstitutionalProjects(actor)) {
    return { ok: false, message: "No tenés permiso para editar proyectos." };
  }

  const existing = await prisma.institutionalProject.findUnique({ where: { id: projectId } });
  if (!existing) {
    return { ok: false, message: "Proyecto no encontrado." };
  }

  if (!canMutateInstitutionalProject(actor, existing.companyId)) {
    return { ok: false, message: "No podés modificar este proyecto." };
  }

  const parsed = institutionalProjectFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá los campos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { title, description, mission, vision, year, methodology, status } = parsed.data;

  await prisma.institutionalProject.update({
    where: { id: projectId },
    data: {
      title,
      description: description ?? null,
      mission: mission ?? null,
      vision: vision ?? null,
      year: year ?? null,
      methodology: methodology ?? null,
      status,
    },
  });

  revalidatePath("/proyecto");
  revalidatePath(`/proyecto/${projectId}`);
  revalidatePath(`/proyecto/${projectId}/edit`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setInstitutionalProjectStatus(
  projectId: string,
  statusRaw: unknown
): Promise<InstitutionalProjectActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateInstitutionalProjects(actor)) {
    return { ok: false, message: "No tenés permiso para cambiar el estado." };
  }

  const statusParsed = institutionalProjectStatusSchema.safeParse(statusRaw);
  if (!statusParsed.success) {
    return { ok: false, message: "Estado no válido." };
  }

  const status = statusParsed.data as InstitutionalProjectStatus;

  const existing = await prisma.institutionalProject.findUnique({ where: { id: projectId } });
  if (!existing) {
    return { ok: false, message: "Proyecto no encontrado." };
  }

  if (!canMutateInstitutionalProject(actor, existing.companyId)) {
    return { ok: false, message: "No podés modificar este proyecto." };
  }

  await prisma.institutionalProject.update({
    where: { id: projectId },
    data: { status },
  });

  revalidatePath("/proyecto");
  revalidatePath(`/proyecto/${projectId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
