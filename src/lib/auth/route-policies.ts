import type { UserRole } from "@/generated/prisma";

/**
 * Rutas que exigen roles concretos (pathname exacto o prefijo).
 * Debe alinearse con `config/navigation.ts`.
 */
export const routeRolePolicies: { match: (pathname: string) => boolean; roles: UserRole[] }[] = [
  {
    match: (p) => p === "/companies" || p.startsWith("/companies/"),
    roles: ["SUPER_ADMIN"],
  },
  {
    match: (p) => p === "/usuarios" || p.startsWith("/usuarios/"),
    roles: ["SUPER_ADMIN", "ADMIN_EMPRESA"],
  },
  {
    match: (p) => p === "/equipo" || p.startsWith("/equipo/"),
    roles: ["SUPER_ADMIN", "ADMIN_EMPRESA"],
  },
  {
    match: (p) => p === "/configuracion" || p.startsWith("/configuracion/"),
    roles: ["SUPER_ADMIN", "ADMIN_EMPRESA"],
  },
];

const TENANT_PATH_PREFIXES = [
  "/proyecto",
  "/objetivos",
  "/resultados-clave",
  "/actividades",
] as const;

/** Rutas de datos por empresa: OPERADOR/ADMIN deben tener `company_id`. SUPER_ADMIN puede entrar sin empresa (vistas globales / placeholder). */
export function requiresCompanyContext(pathname: string): boolean {
  return TENANT_PATH_PREFIXES.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}
