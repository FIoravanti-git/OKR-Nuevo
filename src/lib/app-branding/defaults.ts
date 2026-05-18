import type { AppBrandingConfig } from "./types";

export function getDefaultAppBranding(): AppBrandingConfig {
  return {
    appName: "OKR Stack",
    logoUrl: null,
    logoAlt: "OKR Stack",
    faviconUrl: null,
    primaryColor: "#334155",
    secondaryColor: "#64748b",
  };
}
