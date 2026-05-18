import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getToken } from "next-auth/jwt";
import { LandingPage } from "@/components/landing/landing-page";

/**
 * Nunca redirigir a /login desde aquí.
 * Sin sesión → landing. Con sesión → dashboard.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: { absolute: "OKR Stack | Estrategia que se ejecuta" },
  description:
    "Plataforma empresarial para OKR: objetivos institucionales, resultados clave, actividades, áreas, dashboards ejecutivos, reportes y app instalable (PWA).",
  openGraph: {
    title: "OKR Stack | Estrategia que se ejecuta",
    description:
      "Alineá objetivos, métricas y ejecución en un solo stack. Demo, planes y PWA para equipos distribuidos.",
  },
};

export default async function HomePage() {
  const secret = process.env.AUTH_SECRET;
  if (secret) {
    const cookieStore = await cookies();
    const token = await getToken({
      req: { headers: { cookie: cookieStore.toString() } },
      secret,
      secureCookie: process.env.NODE_ENV === "production",
    });
    if (token?.sub) {
      redirect("/dashboard");
    }
  }

  return <LandingPage />;
}
