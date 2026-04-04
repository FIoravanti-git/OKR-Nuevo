"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth/session-user";
import { prisma } from "@/lib/prisma";
import {
  adminEmpresaMustHaveCompany,
  canMutateAreas,
  canViewAreaRecord,
} from "@/lib/areas/policy";
import type { AreaActionResult } from "@/lib/areas/actions";
import { countResponsablesInArea } from "@/lib/areas/area-member-service";

async function assertCanMutateArea(areaId: string): Promise<
  | { ok: true; area: { id: string; companyId: string } }
  | { ok: false; result: AreaActionResult }
> {
  const actor = await requireSessionUser();

  if (!canMutateAreas(actor) || adminEmpresaMustHaveCompany(actor)) {
    return { ok: false, result: { ok: false, message: "No tenés permiso para administrar miembros del área." } };
  }

  const area = await prisma.area.findUnique({
    where: { id: areaId },
    select: { id: true, companyId: true },
  });

  if (!area) {
    return { ok: false, result: { ok: false, message: "Área no encontrada." } };
  }

  if (!canViewAreaRecord(actor, area.companyId)) {
    return { ok: false, result: { ok: false, message: "No tenés permiso para modificar esta área." } };
  }

  return { ok: true, area };
}

function revalidateAreaPaths(areaId: string) {
  revalidatePath("/areas");
  revalidatePath(`/areas/${areaId}`);
  revalidatePath(`/areas/${areaId}/edit`);
  revalidatePath("/usuarios");
}

export async function addUserToArea(areaId: string, userId: string): Promise<AreaActionResult> {
  const gate = await assertCanMutateArea(areaId);
  if (!gate.ok) return gate.result;

  const user = await prisma.user.findFirst({
    where: { id: userId, companyId: gate.area.companyId, isActive: true },
    select: { id: true },
  });

  if (!user) {
    return { ok: false, message: "Usuario no encontrado o no pertenece a esta empresa." };
  }

  const existing = await prisma.areaMember.findUnique({
    where: { areaId_userId: { areaId, userId } },
  });
  if (existing) {
    return { ok: false, message: "Este usuario ya está en el área." };
  }

  await prisma.areaMember.create({
    data: { areaId, userId, esResponsable: false },
  });

  revalidateAreaPaths(areaId);
  return { ok: true };
}

export async function removeUserFromArea(areaId: string, userId: string): Promise<AreaActionResult> {
  const gate = await assertCanMutateArea(areaId);
  if (!gate.ok) return gate.result;

  const row = await prisma.areaMember.findUnique({
    where: { areaId_userId: { areaId, userId } },
    select: { esResponsable: true },
  });

  if (!row) {
    return { ok: false, message: "El usuario no pertenece a esta área." };
  }

  if (row.esResponsable) {
    const n = await countResponsablesInArea(prisma, areaId);
    if (n <= 1) {
      return {
        ok: false,
        message:
          "No se puede quitar al único responsable del área. Asigná primero otro responsable o agregá un miembro y designalo responsable.",
      };
    }
  }

  await prisma.areaMember.delete({
    where: { areaId_userId: { areaId, userId } },
  });

  revalidateAreaPaths(areaId);
  return { ok: true };
}

const MSG_LAST_RESPONSIBLE =
  "Tiene que haber al menos un responsable. Designá a otra persona antes de quitar este rol.";

/**
 * Activa o desactiva el rol de responsable para un miembro (puede haber varios por área).
 * No se puede dejar al área sin ningún responsable.
 */
export async function setMemberResponsible(
  areaId: string,
  userId: string,
  responsible: boolean
): Promise<AreaActionResult> {
  const gate = await assertCanMutateArea(areaId);
  if (!gate.ok) return gate.result;

  const member = await prisma.areaMember.findUnique({
    where: { areaId_userId: { areaId, userId } },
    include: { user: { select: { companyId: true, isActive: true } } },
  });

  if (!member || member.user.companyId !== gate.area.companyId || !member.user.isActive) {
    return { ok: false, message: "Solo podés gestionar miembros activos de esta área." };
  }

  if (responsible) {
    await prisma.areaMember.update({
      where: { areaId_userId: { areaId, userId } },
      data: { esResponsable: true },
    });
    revalidateAreaPaths(areaId);
    return { ok: true };
  }

  const n = await countResponsablesInArea(prisma, areaId);
  if (member.esResponsable && n <= 1) {
    return { ok: false, message: MSG_LAST_RESPONSIBLE };
  }

  await prisma.areaMember.update({
    where: { areaId_userId: { areaId, userId } },
    data: { esResponsable: false },
  });

  revalidateAreaPaths(areaId);
  return { ok: true };
}
