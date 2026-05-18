import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { UserRole } from "@/generated/prisma";
import { requiresCompanyContext, routeRolePolicies } from "@/lib/auth/route-policies";

type AppJwt = {
  sub?: string;
  role?: UserRole;
  companyId?: string | null;
};

/**
 * Next.js 16+: `src/proxy.ts`.
 * Solo corre en rutas privadas (ver `config.matcher`): "/" y "/login" nunca entran aquí.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET debe estar definida");
  }

  const token = (await getToken({
    req: request,
    secret,
    secureCookie: process.env.NODE_ENV === "production",
  })) as AppJwt | null;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  for (const policy of routeRolePolicies) {
    if (policy.match(pathname) && !policy.roles.includes(token.role as UserRole)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (
    requiresCompanyContext(pathname) &&
    (token.companyId == null || token.companyId === "") &&
    token.role !== "SUPER_ADMIN"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

/** Literal requerido por Next (no spread en `matcher`). Mantener alineado con `PROTECTED_ROUTE_MATCHER`. */
export const config = {
  matcher: [
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
  ],
};
