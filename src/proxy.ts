import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { UserRole } from "@/generated/prisma";
import { isPublicPath } from "@/lib/auth/public-paths";
import { requiresCompanyContext, routeRolePolicies } from "@/lib/auth/route-policies";

type AppJwt = {
  sub?: string;
  role?: UserRole;
  companyId?: string | null;
};

/**
 * Next.js 16+: `src/proxy.ts` (sustituye a `middleware.ts`).
 * Las rutas públicas deben salir antes de JWT para que "/" muestre la landing.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

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

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
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

export const config = {
  matcher: [
    "/",
    "/login",
    "/manifest.json",
    "/sw.js",
    "/icon-192.png",
    "/icon-512.png",
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icon-192.png|icon-512.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
