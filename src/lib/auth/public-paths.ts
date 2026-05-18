/**
 * Rutas públicas (documentación / referencia).
 * El proxy NO usa un matcher global: estas rutas no están en PROTECTED_ROUTE_MATCHER.
 */
export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/manifest.json",
  "/sw.js",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.ico",
] as const;
