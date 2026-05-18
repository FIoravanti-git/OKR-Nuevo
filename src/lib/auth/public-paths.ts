/**
 * Rutas accesibles sin sesión (marketing, login, PWA y estáticos).
 * Usado por `src/proxy.ts` antes de `getToken` / redirecciones.
 */
const PUBLIC_EXACT = new Set([
  "/",
  "/login",
  "/manifest.json",
  "/sw.js",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
]);

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) {
    return true;
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/workbox-") ||
    pathname.startsWith("/swe-worker-") ||
    pathname.startsWith("/api/auth")
  ) {
    return true;
  }

  return /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname);
}
