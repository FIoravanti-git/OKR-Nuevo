"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma";
import { requireSessionUser } from "@/lib/auth/session-user";
import { prisma } from "@/lib/prisma";
import { MSG_AREA_DELETE_BLOCKED } from "@/lib/areas/area-delete-messages";
import { isAreaDeletable } from "@/lib/areas/area-deletion";
import {
  adminEmpresaMustHaveCompany,
  canMutateAreas,
  canViewAreaRecord,
  enforcedCompanyIdForAreaWrite,
} from "@/lib/areas/policy";
import { areaCreateSchema, areaUpdateSchema } from "@/lib/areas/schemas";
import { countResponsablesInArea } from "@/lib/areas/area-member-service";

export type AreaActionResult =
  | { ok: true; createdAreaId?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

async function assertManagerBelongsToCompany(managerUserId: string, companyId: string) {
  const u = await prisma.user.findFirst({
    where: { id: managerUserId, companyId, isActive: true },
    select: { id: true },
  });
  return !!u;
}

/** Un único responsable “principal” por área en formulario: todos false y el elegido true. */
async function setPrincipalResponsable(tx: Prisma.TransactionClient, areaId: string, userId: string) {
  await tx.areaMember.updateMany({
    where: { areaId },
    data: { esResponsable: false },
  });
  await tx.areaMember.upsert({
    where: { areaId_userId: { areaId, userId } },
    create: { areaId, userId, esResponsable: true },
    update: { esResponsable: true },
  });
}

export async function createArea(input: unknown): Promise<AreaActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateAreas(actor)) {
    return { ok: false, message: "No tenés permiso para administrar áreas." };
  }

  if (adminEmpresaMustHaveCompany(actor)) {
    return { ok: false, message: "Tu usuario no tiene empresa asignada." };
  }

  const parsed = areaCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá los campos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const companyId = enforcedCompanyIdForAreaWrite(actor, parsed.data.companyId);
  if (!companyId) {
    return {
      ok: false,
      message: "Seleccioná una empresa.",
      fieldErrors: { companyId: ["Requerido"] },
    };
  }

  const okMgr = await assertManagerBelongsToCompany(parsed.data.managerUserId, companyId);
  if (!okMgr) {
    return {
      ok: false,
      message: "El responsable debe ser un usuario activo de la misma empresa.",
      fieldErrors: { managerUserId: ["Usuario no válido para esta empresa"] },
    };
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.area.create({
        data: {
          companyId,
          name: parsed.data.name.trim(),
          description: parsed.data.description ?? null,
          status: parsed.data.status,
        },
        select: { id: true },
      });
      await setPrincipalResponsable(tx, row.id, parsed.data.managerUserId);
      const n = await countResponsablesInArea(tx, row.id);
      if (n < 1) {
        throw new Error("AREA_SIN_RESPONSABLE");
      }
      return row;
    });
    revalidatePath("/areas");
    revalidatePath(`/areas/${created.id}`);
    revalidatePath(`/areas/${created.id}/edit`);
    revalidatePath("/usuarios");
    return { ok: true, createdAreaId: created.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Ya existe un área con ese nombre en la empresa." };
    }
    throw e;
  }
}

export async function updateArea(areaId: string, input: unknown): Promise<AreaActionResult> {
  const actor = await requireSessionUser();

  if (!canMutateAreas(actor)) {
    return { ok: false, message: "No tenés permiso para administrar áreas." };
  }

  if (adminEmpresaMustHaveCompany(actor)) {
    return { ok: false, message: "Tu usuario no tiene empresa asignada." };
  }

  const existing = await prisma.area.findUnique({ where: { id: areaId } });
  if (!existing) {
    return { ok: false, message: "Área no encontrada." };
  }

  if (actor.role === "ADMIN_EMPRESA") {
    if (!actor.companyId || actor.companyId !== existing.companyId) {
      return { ok: false, message: "No tenés permiso para modificar esta área." };
    }
  }

  const parsed = areaUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá los campos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await prisma.area.update({
      where: { id: areaId },
      data: {
        name: parsed.data.name.trim(),
        description: parsed.data.description ?? null,
        status: parsed.data.status,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Ya existe un área con ese nombre en la empresa." };
    }
    throw e;
  }

  revalidatePath("/areas");
  revalidatePath(`/areas/${areaId}`);
  revalidatePath(`/areas/${areaId}/edit`);
  revalidatePath("/usuarios");
  return { ok: true };
}

export type AreaDeleteResult = { ok: true } | { ok: false; message: string };

export async function deleteArea(areaId: string): Promise<AreaDeleteResult> {
  const actor = await requireSessionUser();

  if (!canMutateAreas(actor) || adminEmpresaMustHaveCompany(actor)) {
    return { ok: false, message: "No tenés permiso para eliminar áreas." };
  }

  const area = await prisma.area.findUnique({
    where: { id: areaId },
    select: { id: true, companyId: true },
  });
  if (!area) {
    return { ok: false, message: "Área no encontrada." };
  }

  if (!canViewAreaRecord(actor, area.companyId)) {
    return { ok: false, message: "No tenés permiso para eliminar esta área." };
  }

  if (!(await isAreaDeletable(areaId))) {
    return { ok: false, message: MSG_AREA_DELETE_BLOCKED };
  }

  await prisma.area.delete({ where: { id: areaId } });

  revalidatePath("/areas");
  revalidatePath("/usuarios");
  revalidatePath("/dashboard");
  return { ok: true };
}
