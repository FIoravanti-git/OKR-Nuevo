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

/** Next.js 16+: sustituye a `middleware.ts` (convención `proxy`). */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /** PWA: el SW y el manifiesto deben servirse sin sesión (instalación / actualizaciones). */
  if (
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/workbox-") ||
    pathname.startsWith("/swe-worker-")
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.(?:svg|png|jpg|jpeg|gif|webp)$/.test(pathname)
  ) {
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

  const isLogin = pathname === "/login";

  if (!token && !isLogin) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (token && isLogin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (token) {
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
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
