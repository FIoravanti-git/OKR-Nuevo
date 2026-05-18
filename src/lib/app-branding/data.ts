import { prisma } from "@/lib/prisma";
import { APP_BRANDING_ROW_ID } from "./constants";
import { getDefaultAppBranding } from "./defaults";
import type { AppBrandingConfig } from "./types";

export async function getAppBranding(): Promise<AppBrandingConfig> {
  const defaults = getDefaultAppBranding();

  try {
    const row = await prisma.appBranding.findUnique({
      where: { id: APP_BRANDING_ROW_ID },
    });

    if (!row) return defaults;

    return {
      appName: row.appName,
      logoUrl: row.logoUrl,
      logoAlt: row.logoAlt ?? defaults.logoAlt,
      faviconUrl: row.faviconUrl,
      primaryColor: row.primaryColor,
      secondaryColor: row.secondaryColor,
    };
  } catch {
    return defaults;
  }
}

export async function getAppBrandingAdmin(): Promise<{
  hasPersistedRow: boolean;
  config: AppBrandingConfig;
}> {
  const defaults = getDefaultAppBranding();
  const row = await prisma.appBranding.findUnique({
    where: { id: APP_BRANDING_ROW_ID },
  });

  if (!row) {
    return { hasPersistedRow: false, config: defaults };
  }

  return {
    hasPersistedRow: true,
    config: {
      appName: row.appName,
      logoUrl: row.logoUrl,
      logoAlt: row.logoAlt ?? "",
      faviconUrl: row.faviconUrl,
      primaryColor: row.primaryColor,
      secondaryColor: row.secondaryColor,
    },
  };
}
