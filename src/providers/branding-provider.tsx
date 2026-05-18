"use client";

import { createContext, useContext } from "react";
import { getDefaultAppBranding } from "@/lib/app-branding/defaults";
import type { AppBrandingConfig } from "@/lib/app-branding/types";

const BrandingContext = createContext<AppBrandingConfig>(getDefaultAppBranding());

export function BrandingProvider({
  branding,
  children,
}: {
  branding: AppBrandingConfig;
  children: React.ReactNode;
}) {
  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>;
}

export function useAppBranding(): AppBrandingConfig {
  return useContext(BrandingContext);
}
