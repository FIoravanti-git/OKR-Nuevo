import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LandingPage } from "@/components/landing/landing-page";

/** Siempre evaluar sesión en servidor; nunca redirigir a /login desde aquí (eso lo hace el proxy en rutas privadas). */
export const dynamic = "force-dynamic";

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
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }
  return <LandingPage />;
}
