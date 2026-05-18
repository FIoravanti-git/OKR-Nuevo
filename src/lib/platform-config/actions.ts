"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session-user";
import { isValidEmailSimple, keepIfEmpty, keepStringWithDefault } from "@/lib/config/partial-save";
import { prisma } from "@/lib/prisma";
import { PLATFORM_CONFIG_ROW_ID } from "./constants";
import { platformConfigFormSchema } from "./schemas";

const DEFAULT_DISPLAY_NAME = "OKR Stack";

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

  const existing = await prisma.platformConfig.findUnique({
    where: { id: PLATFORM_CONFIG_ROW_ID },
    select: { displayName: true, supportEmail: true, noticeBanner: true },
  });

  const raw = parsed.data;
  const fieldErrors: Record<string, string[]> = {};

  const displayNameInput = raw.displayName?.trim() ?? "";
  if (displayNameInput.length > 0 && displayNameInput.length < 2) {
    fieldErrors.displayName = ["Si completás el nombre, usá al menos 2 caracteres."];
  }

  const supportEmailInput = raw.supportEmail?.trim() ?? "";
  if (supportEmailInput.length > 0 && !isValidEmailSimple(supportEmailInput)) {
    fieldErrors.supportEmail = ["El correo de soporte no es válido."];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "Revisá los campos marcados.",
      fieldErrors,
    };
  }

  const displayName = keepStringWithDefault(raw.displayName, existing?.displayName, DEFAULT_DISPLAY_NAME);
  const supportEmail = keepIfEmpty(raw.supportEmail, existing?.supportEmail);
  const noticeBanner = keepIfEmpty(raw.noticeBanner, existing?.noticeBanner);

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
