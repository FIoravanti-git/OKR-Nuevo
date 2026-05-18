import type { AppBrandingConfig } from "@/lib/app-branding/types";

type Props = {
  branding: Pick<AppBrandingConfig, "primaryColor" | "secondaryColor">;
};

/** Inyecta colores de marca en variables CSS globales (sin romper el tema base). */
export function BrandingTheme({ branding }: Props) {
  const css = `
:root {
  --primary: ${branding.primaryColor};
  --secondary: ${branding.secondaryColor};
  --sidebar-primary: ${branding.primaryColor};
}
.dark {
  --primary: ${branding.primaryColor};
  --secondary: ${branding.secondaryColor};
  --sidebar-primary: ${branding.primaryColor};
}
`.trim();

  return <style id="app-branding-theme" dangerouslySetInnerHTML={{ __html: css }} />;
}
