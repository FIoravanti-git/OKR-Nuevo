"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma";
import type { UserRole } from "@/generated/prisma";
import { requireRole } from "@/lib/auth/session-user";
import { prisma } from "@/lib/prisma";
import {
  adminCanManageTarget,
  adminEmpresaMustHaveCompany,
  enforcedCompanyIdForWrite,
  rolesCreatableBy,
} from "@/lib/users/policy";
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

  if (!rolesCreatableBy(actor).includes(role)) {
    return { ok: false, message: "No podés crear usuarios con ese rol." };
  }

  const enforced = enforcedCompanyIdForWrite(actor, requestedCompany);
  const companyId = resolveCompanyIdForRole(role, enforced, requestedCompany);

  if (role !== "SUPER_ADMIN" && !companyId) {
    return { ok: false, message: "La empresa es obligatoria para este rol.", fieldErrors: { companyId: ["Requerido"] } };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        companyId,
        isActive,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Ya existe un usuario con ese correo." };
    }
    throw e;
  }

  revalidatePath("/usuarios");
  revalidatePath("/dashboard");
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
    await prisma.user.update({
      where: { id: userId },
      data,
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

  if (target.isActive && target.id === actor.id) {
    return { ok: false, message: "No podés desactivar tu propia cuenta." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !target.isActive },
  });

  revalidatePath("/usuarios");
  revalidatePath("/dashboard");
  return { ok: true };
}
