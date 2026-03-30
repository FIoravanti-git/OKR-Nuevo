"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session-user";
import { prisma } from "@/lib/prisma";
import { PLATFORM_CONFIG_ROW_ID } from "./constants";
import { platformConfigFormSchema } from "./schemas";

export type PlatformConfigActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function upsertPlatformConfig(input: unknown): Promise<PlatformConfigActionResult> {
  await requireRole("SUPER_ADMIN");

  const parsed = platformConfigFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá los campos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { displayName, supportEmail, noticeBanner } = parsed.data;

  await prisma.platformConfig.upsert({
    where: { id: PLATFORM_CONFIG_ROW_ID },
    create: {
      id: PLATFORM_CONFIG_ROW_ID,
      displayName,
      supportEmail,
      noticeBanner,
    },
    update: {
      displayName,
      supportEmail,
      noticeBanner,
    },
  });

  revalidatePath("/configuracion");
  revalidatePath("/dashboard");
  return { ok: true };
}
