"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma";
import type { UserRole } from "@/generated/prisma";
import { requireRole } from "@/lib/auth/session-user";
import { prisma } from "@/lib/prisma";
import { isAreaInCompany } from "@/lib/areas/validate-area-company";
import {
  messageCannotLeaveAsSoleResponsable,
  validateUserCanLeaveAreas,
} from "@/lib/areas/validate-area-responsible";
import {
  adminCanManageTarget,
  adminEmpresaMustHaveCompany,
  enforcedCompanyIdForWrite,
  rolesCreatableBy,
} from "@/lib/users/policy";
import { MSG_USER_DELETE_BLOCKED } from "@/lib/users/user-delete-messages";
import { isUserDeletable } from "@/lib/users/user-deletion";
import { userCreateFormSchema, userUpdateFormSchema } from "@/lib/users/schemas";

export type UserActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

function resolveCompanyIdForRole(role: UserRole, enforced: string | null, requested?: string): string | null {
  if (role === "SUPER_ADMIN") {
    return null;
  }
  return enforced && enforced !== "" ? enforced : requested && requested !== "" ? requested.trim() : null;
}

export async function createUser(input: unknown): Promise<UserActionResult> {
  const actor = await requireRole("SUPER_ADMIN", "ADMIN_EMPRESA");

  if (adminEmpresaMustHaveCompany(actor)) {
    return { ok: false, message: "Tu usuario no tiene empresa asignada." };
  }

  const parsed = userCreateFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá los campos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, email, password, role, isActive } = parsed.data;
  const requestedCompany = parsed.data.companyId?.trim() || undefined;
  const rawAreaId = parsed.data.areaId?.trim();

  if (!rolesCreatableBy(actor).includes(role)) {
    return { ok: false, message: "No podés crear usuarios con ese rol." };
  }

  const enforced = enforcedCompanyIdForWrite(actor, requestedCompany);
  const companyId = resolveCompanyIdForRole(role, enforced, requestedCompany);

  if (role !== "SUPER_ADMIN" && !companyId) {
    return { ok: false, message: "La empresa es obligatoria para este rol.", fieldErrors: { companyId: ["Requerido"] } };
  }

  let areaId: string | null = rawAreaId && rawAreaId !== "" ? rawAreaId : null;
  if (!companyId) {
    areaId = null;
  }
  if (areaId && companyId) {
    const ok = await isAreaInCompany(areaId, companyId);
    if (!ok) {
      return {
        ok: false,
        message: "El área no pertenece a la empresa seleccionada.",
        fieldErrors: { areaId: ["Área no válida"] },
      };
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash,
          role,
          companyId,
          isActive,
        },
      });
      if (areaId && companyId) {
        await tx.areaMember.create({
          data: { areaId, userId: user.id, esResponsable: false },
        });
      }
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Ya existe un usuario con ese correo." };
    }
    throw e;
  }

  revalidatePath("/usuarios");
  revalidatePath("/dashboard");
  revalidatePath("/areas");
  if (areaId) {
    revalidatePath(`/areas/${areaId}`);
  }
  return { ok: true };
}

export async function updateUser(userId: string, input: unknown): Promise<UserActionResult> {
  const actor = await requireRole("SUPER_ADMIN", "ADMIN_EMPRESA");

  if (adminEmpresaMustHaveCompany(actor)) {
    return { ok: false, message: "Tu usuario no tiene empresa asignada." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return { ok: false, message: "Usuario no encontrado." };
  }

  if (!adminCanManageTarget(actor, target)) {
    return { ok: false, message: "No tenés permiso para modificar este usuario." };
  }

  const parsed = userUpdateFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá los campos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, email, role, isActive } = parsed.data;
  const pwdRaw = parsed.data.password;
  const requestedCompany = parsed.data.companyId?.trim() || undefined;
  const rawAreaId = parsed.data.areaId?.trim();

  if (!rolesCreatableBy(actor).includes(role)) {
    return { ok: false, message: "No podés asignar ese rol." };
  }

  if (actor.role === "ADMIN_EMPRESA" && role === "SUPER_ADMIN") {
    return { ok: false, message: "No podés asignar el rol de super administrador." };
  }

  if (!isActive && target.id === actor.id) {
    return { ok: false, message: "No podés desactivar tu propia cuenta." };
  }

  const enforced = enforcedCompanyIdForWrite(actor, requestedCompany);
  const companyId = resolveCompanyIdForRole(role, enforced, requestedCompany);

  if (role !== "SUPER_ADMIN" && !companyId) {
    return { ok: false, message: "La empresa es obligatoria para este rol.", fieldErrors: { companyId: ["Requerido"] } };
  }

  let areaId: string | null = rawAreaId && rawAreaId !== "" ? rawAreaId : null;
  if (!companyId) {
    areaId = null;
  }
  if (areaId && companyId) {
    const ok = await isAreaInCompany(areaId, companyId);
    if (!ok) {
      return {
        ok: false,
        message: "El área no pertenece a la empresa seleccionada.",
        fieldErrors: { areaId: ["Área no válida"] },
      };
    }
  }

  const currentLinks = await prisma.areaMember.findMany({
    where: { userId },
    select: { areaId: true },
  });
  const currentAreaIds = currentLinks.map((l) => l.areaId);
  const desiredAreaIds = areaId ? [areaId] : [];
  const toLeave = currentAreaIds.filter((id) => !desiredAreaIds.includes(id));

  const leaveOk = await validateUserCanLeaveAreas(userId, toLeave);
  if (!leaveOk.ok) {
    return {
      ok: false,
      message: messageCannotLeaveAsSoleResponsable(leaveOk.areaName),
      fieldErrors: {
        areaId: ["Reasigná el responsable en el módulo Áreas antes de mover a este usuario."],
      },
    };
  }

  const data: Prisma.UserUncheckedUpdateInput = {
    name,
    email: email.toLowerCase(),
    role,
    companyId,
    isActive,
  };

  const pwd = pwdRaw.trim();
  if (pwd.length > 0) {
    data.passwordHash = await bcrypt.hash(pwd, 12);
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.areaMember.deleteMany({ where: { userId } });
      if (areaId && companyId) {
        await tx.areaMember.create({
          data: { areaId, userId, esResponsable: false },
        });
      }
      await tx.user.update({
        where: { id: userId },
        data,
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Ya existe otro usuario con ese correo." };
    }
    throw e;
  }

  revalidatePath("/usuarios");
  revalidatePath(`/usuarios/${userId}/edit`);
  revalidatePath("/dashboard");
  revalidatePath("/areas");
  for (const aid of new Set([...currentAreaIds, ...(areaId ? [areaId] : [])])) {
    revalidatePath(`/areas/${aid}`);
  }
  return { ok: true };
}

export async function toggleUserActive(userId: string): Promise<UserActionResult> {
  const actor = await requireRole("SUPER_ADMIN", "ADMIN_EMPRESA");

  if (adminEmpresaMustHaveCompany(actor)) {
    return { ok: false, message: "Tu usuario no tiene empresa asignada." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return { ok: false, message: "Usuario no encontrado." };
  }

  if (!adminCanManageTarget(actor, target)) {
    return { ok: false, message: "No tenés permiso para modificar este usuario." };
  }

  if (target.id === actor.id) {
    return { ok: false, message: "No podés desactivar tu propia cuenta." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !target.isActive },
  });

  revalidatePath("/usuarios");
  revalidatePath(`/usuarios/${userId}/edit`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export type UserDeleteResult = { ok: true } | { ok: false; message: string };

export async function deleteUser(userId: string): Promise<UserDeleteResult> {
  const actor = await requireRole("SUPER_ADMIN", "ADMIN_EMPRESA");

  if (adminEmpresaMustHaveCompany(actor)) {
    return { ok: false, message: "Tu usuario no tiene empresa asignada." };
  }

  if (actor.id === userId) {
    return { ok: false, message: "No podés eliminar tu propia cuenta." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return { ok: false, message: "Usuario no encontrado." };
  }

  if (!adminCanManageTarget(actor, target)) {
    return { ok: false, message: "No tenés permiso para eliminar este usuario." };
  }

  if (!(await isUserDeletable(userId))) {
    return { ok: false, message: MSG_USER_DELETE_BLOCKED };
  }

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/usuarios");
  revalidatePath("/dashboard");
  revalidatePath("/areas");
  return { ok: true };
}
