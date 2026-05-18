/**
 * Rutas que exigen sesión. El proxy/middleware solo debe ejecutarse aquí;
 * "/" y "/login" quedan fuera del matcher y no pueden redirigirse a /login.
 */
export const PROTECTED_ROUTE_MATCHER = [
  "/dashboard/:path*",
  "/companies/:path*",
  "/usuarios/:path*",
  "/areas/:path*",
  "/equipo/:path*",
  "/proyecto/:path*",
  "/objetivos-clave/:path*",
  "/objetivos/:path*",
  "/resultados-clave/:path*",
  "/actividades/:path*",
  "/reportes/:path*",
  "/configuracion/:path*",
] as const;
