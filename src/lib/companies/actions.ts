"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma";
import { requireRole } from "@/lib/auth/session-user";
import { prisma } from "@/lib/prisma";
import { tenantCompanySettingsSchema } from "@/lib/companies/tenant-schema";
import { companyCreateSchema, companyFormSchema } from "@/lib/companies/schemas";

export type CompanyActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

async function replaceActiveSubscription(companyId: string, planId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.companySubscription.updateMany({
      where: { companyId, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    });
    await tx.companySubscription.create({
      data: {
        companyId,
        planId,
        status: "ACTIVE",
      },
    });
  });
}

export async function createCompany(input: unknown): Promise<CompanyActionResult> {
  await requireRole("SUPER_ADMIN");

  const parsed = companyCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá los campos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, slug, ruc, email, phone, maxUsers, planId, syncMaxFromPlan } = parsed.data;

  let effectiveMaxUsers = maxUsers;
  if (planId && syncMaxFromPlan) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return { ok: false, message: "El plan seleccionado no existe." };
    }
    effectiveMaxUsers = plan.maxUsers;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.company.create({
        data: {
          name,
          slug,
          ruc: ruc ?? null,
          email: email ?? null,
          phone: phone ?? null,
          maxUsers: effectiveMaxUsers,
          isActive: parsed.data.isActive,
        },
      });

      const created = await tx.company.findUniqueOrThrow({ where: { slug } });

      if (planId) {
        await tx.companySubscription.create({
          data: {
            companyId: created.id,
            planId,
            status: "ACTIVE",
          },
        });
      }
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Ya existe una empresa con ese slug. Elegí otro identificador URL." };
    }
    throw e;
  }

  revalidatePath("/companies");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateCompany(companyId: string, input: unknown): Promise<CompanyActionResult> {
  await requireRole("SUPER_ADMIN");

  const parsed = companyFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá los campos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, slug, ruc, email, phone, maxUsers, planId, syncMaxFromPlan, isActive } = parsed.data;

  const existing = await prisma.company.findUnique({ where: { id: companyId } });
  if (!existing) {
    return { ok: false, message: "La empresa no existe o fue eliminada." };
  }

  let effectiveMaxUsers = maxUsers;
  if (planId && syncMaxFromPlan) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return { ok: false, message: "El plan seleccionado no existe." };
    }
    effectiveMaxUsers = plan.maxUsers;
  }

  try {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        name,
        slug,
        ruc: ruc ?? null,
        email: email ?? null,
        phone: phone ?? null,
        maxUsers: effectiveMaxUsers,
        isActive,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Ya existe otra empresa con ese slug." };
    }
    throw e;
  }

  if (planId) {
    const current = await prisma.companySubscription.findFirst({
      where: { companyId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
    if (!current || current.planId !== planId) {
      await replaceActiveSubscription(companyId, planId);
    }
  } else {
    await prisma.companySubscription.updateMany({
      where: { companyId, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    });
  }

  revalidatePath("/companies");
  revalidatePath(`/companies/${companyId}`);
  revalidatePath(`/companies/${companyId}/edit`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function toggleCompanyActive(companyId: string): Promise<CompanyActionResult> {
  await requireRole("SUPER_ADMIN");

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    return { ok: false, message: "Empresa no encontrada." };
  }

  await prisma.company.update({
    where: { id: companyId },
    data: { isActive: !company.isActive },
  });

  revalidatePath("/companies");
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * ADMIN_EMPRESA: actualiza solo datos de contacto e identificación de su empresa.
 * No modifica plan, cupo ni estado activo (solo SUPER_ADMIN).
 */
export async function updateMyCompanyTenantSettings(input: unknown): Promise<CompanyActionResult> {
  const user = await requireRole("ADMIN_EMPRESA");
  if (!user.companyId) {
    return { ok: false, message: "Tu usuario no está vinculado a una empresa." };
  }

  const parsed = tenantCompanySettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá los campos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, slug, ruc, email, phone } = parsed.data;

  try {
    await prisma.company.update({
      where: { id: user.companyId },
      data: {
        name,
        slug,
        ruc: ruc ?? null,
        email: email ?? null,
        phone: phone ?? null,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "Ya existe otra empresa con ese slug. Elegí otro identificador." };
    }
    throw e;
  }

  revalidatePath("/configuracion");
  revalidatePath("/dashboard");
  revalidatePath("/companies");
  return { ok: true };
}

export async function assignCompanyPlan(companyId: string, planId: string): Promise<CompanyActionResult> {
  await requireRole("SUPER_ADMIN");

  const [company, plan] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId } }),
    prisma.plan.findUnique({ where: { id: planId } }),
  ]);

  if (!company) return { ok: false, message: "Empresa no encontrada." };
  if (!plan) return { ok: false, message: "Plan no encontrado." };

  await replaceActiveSubscription(companyId, planId);

  await prisma.company.update({
    where: { id: companyId },
    data: { maxUsers: plan.maxUsers },
  });

  revalidatePath("/companies");
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
