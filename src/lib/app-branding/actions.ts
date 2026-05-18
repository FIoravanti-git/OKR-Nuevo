"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session-user";
import { keepHexColor, keepIfEmpty, keepStringWithDefault } from "@/lib/config/partial-save";
import { prisma } from "@/lib/prisma";
import { APP_BRANDING_ROW_ID } from "./constants";
import { getDefaultAppBranding } from "./defaults";
import { appBrandingFormSchema } from "./schemas";

export type AppBrandingActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function upsertAppBranding(input: unknown): Promise<AppBrandingActionResult> {
  await requireRole("SUPER_ADMIN");

  const parsed = appBrandingFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisá los campos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const defaults = getDefaultAppBranding();
  const existing = await prisma.appBranding.findUnique({
    where: { id: APP_BRANDING_ROW_ID },
    select: {
      appName: true,
      logoUrl: true,
      logoAlt: true,
      faviconUrl: true,
      primaryColor: true,
      secondaryColor: true,
    },
  });

  const raw = parsed.data;
  const fieldErrors: Record<string, string[]> = {};

  const appNameInput = raw.appName?.trim() ?? "";
  if (appNameInput.length > 0 && appNameInput.length < 2) {
    fieldErrors.appName = ["Si completás el nombre, usá al menos 2 caracteres."];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Revisá los campos marcados.", fieldErrors };
  }

  const appName = keepStringWithDefault(raw.appName, existing?.appName, defaults.appName);
  const logoUrl = keepIfEmpty(raw.logoUrl, existing?.logoUrl);
  const logoAlt = keepIfEmpty(raw.logoAlt, existing?.logoAlt ?? defaults.logoAlt);
  const faviconUrl = keepIfEmpty(raw.faviconUrl, existing?.faviconUrl);
  const primaryColor = keepHexColor(raw.primaryColor, existing?.primaryColor, defaults.primaryColor);
  const secondaryColor = keepHexColor(raw.secondaryColor, existing?.secondaryColor, defaults.secondaryColor);

  await prisma.appBranding.upsert({
    where: { id: APP_BRANDING_ROW_ID },
    create: {
      id: APP_BRANDING_ROW_ID,
      appName,
      logoUrl,
      logoAlt,
      faviconUrl,
      primaryColor,
      secondaryColor,
    },
    update: {
      appName,
      logoUrl,
      logoAlt,
      faviconUrl,
      primaryColor,
      secondaryColor,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/login", "layout");
  revalidatePath("/configuracion");
  revalidatePath("/dashboard", "layout");

  return { ok: true };
}
