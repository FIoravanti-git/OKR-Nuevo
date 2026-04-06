import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

/**
 * PWA vía @ducanh2912/next-pwa (fork mantenido de next-pwa, compatible con Next.js reciente).
 * Genera el service worker en `public/` al hacer `next build`.
 */
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  /** Navegaciones con next/link quedan en caché para uso offline básico. */
  cacheOnFrontEndNav: true,
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: ({ request, url }) =>
          request.mode === "navigate" && url.pathname === "/dashboard",
        handler: "NetworkFirst",
        options: {
          cacheName: "pwa-offline-dashboard",
          networkTimeoutSeconds: 5,
          expiration: {
            maxEntries: 2,
            maxAgeSeconds: 60 * 60 * 24,
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  devIndicators: false,
};

export default withPWA(nextConfig);
