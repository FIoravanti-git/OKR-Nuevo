"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session-user";
import { prisma } from "@/lib/prisma";
import { APP_BRANDING_ROW_ID } from "./constants";
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

  const d = parsed.data;

  await prisma.appBranding.upsert({
    where: { id: APP_BRANDING_ROW_ID },
    create: {
      id: APP_BRANDING_ROW_ID,
      appName: d.appName,
      logoUrl: d.logoUrl || null,
      logoAlt: d.logoAlt || null,
      faviconUrl: d.faviconUrl || null,
      primaryColor: d.primaryColor,
      secondaryColor: d.secondaryColor,
    },
    update: {
      appName: d.appName,
      logoUrl: d.logoUrl || null,
      logoAlt: d.logoAlt || null,
      faviconUrl: d.faviconUrl || null,
      primaryColor: d.primaryColor,
      secondaryColor: d.secondaryColor,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/login", "layout");
  revalidatePath("/configuracion");
  revalidatePath("/dashboard", "layout");

  return { ok: true };
}
