import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { BrandingTheme } from "@/components/branding/branding-theme";
import { AppProviders } from "@/providers/app-providers";
import { getAppBranding } from "@/lib/app-branding/data";
import { getDefaultAppBranding } from "@/lib/app-branding/defaults";

const fontSans = Inter({
  variable: "--font-app-sans",
  subsets: ["latin"],
  display: "swap",
});

const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const defaults = getDefaultAppBranding();

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getAppBranding();
  const icons = branding.faviconUrl
    ? {
        icon: [{ url: branding.faviconUrl }],
        apple: [{ url: branding.faviconUrl }],
      }
    : {
        icon: [
          { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      };

  return {
    title: {
      default: branding.appName,
      template: `%s | ${branding.appName}`,
    },
    description: "SaaS multiempresa de objetivos y resultados clave con ponderaciones.",
    applicationName: branding.appName,
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: branding.appName,
    },
    formatDetection: {
      telephone: false,
    },
    icons,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: defaults.primaryColor },
    { media: "(prefers-color-scheme: dark)", color: defaults.primaryColor },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = await getAppBranding();

  return (
    <html lang="es-AR" suppressHydrationWarning className={`${fontSans.variable} ${fontMono.variable} h-full`}>
      <body className="min-h-svh flex flex-col antialiased">
        <BrandingTheme branding={branding} />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
