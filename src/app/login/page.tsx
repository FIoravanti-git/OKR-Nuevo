import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  Layers,
  Lock,
  Shield,
  Sparkles,
} from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ingresar | OKR Stack",
  description: "Acceso seguro al panel multiempresa",
};

function LoginFormFallback() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="h-12 animate-pulse rounded-xl bg-muted/60" />
      <div className="h-12 animate-pulse rounded-xl bg-muted/60" />
      <div className="h-12 animate-pulse rounded-xl bg-muted/40" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-[#07060c] text-zinc-100">
      {/* Orbes y malla */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-40%,oklch(0.5_0.19_280/0.35),transparent_65%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,oklch(0.45_0.15_250/0.2),transparent_45%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_80%,oklch(0.4_0.12_300/0.15),transparent_40%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.14_0.03_280/0.5)_0%,transparent_35%,oklch(0.06_0.02_280/0.9)_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)`,
          backgroundSize: "48px 48px",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.25] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-svh max-w-[1200px] flex-col px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:gap-16 lg:px-12 lg:py-14">
        {/* Branding */}
        <div className="mb-12 flex flex-1 flex-col justify-center lg:mb-0 lg:max-w-[28rem] xl:max-w-md">
          <Link
            href="/login"
            className="group mb-12 inline-flex w-fit items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-3 shadow-xl shadow-black/30 ring-1 ring-white/[0.06] backdrop-blur-md transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.06]"
          >
            <span className="relative flex size-[3.25rem] items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900 text-white shadow-lg shadow-black/40 ring-1 ring-white/15">
              <BarChart3 className="size-[1.35rem]" strokeWidth={2.25} />
            </span>
            <span className="text-left">
              <span className="block text-[0.9375rem] font-semibold tracking-tight text-white">OKR Stack</span>
              <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Enterprise
              </span>
            </span>
          </Link>

          <p className="mb-3 text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-violet-400/90">
            Plataforma estratégica
          </p>
          <h1 className="text-balance text-[2rem] font-semibold leading-[1.12] tracking-tight text-white sm:text-[2.35rem] lg:text-[2.5rem]">
            Alineá objetivos.
            <span className="mt-2 block bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text font-semibold text-transparent">
              Medí el impacto real.
            </span>
          </h1>
          <p className="mt-6 max-w-md text-pretty text-[0.9375rem] leading-relaxed text-zinc-400">
            OKR multiempresa con jerarquía institucional, ponderaciones y control de acceso por rol — listo para equipos
            que venden seriedad.
          </p>

          <ul className="mt-12 grid gap-3 sm:grid-cols-1">
            {[
              {
                icon: Shield,
                title: "Acceso corporativo",
                desc: "Sesiones firmadas y credenciales protegidas.",
                accent: "text-emerald-400/90",
              },
              {
                icon: Lock,
                title: "Datos por organización",
                desc: "Arquitectura multiempresa con aislamiento por organización.",
                accent: "text-violet-300/90",
              },
              {
                icon: Layers,
                title: "OKR de extremo a extremo",
                desc: "Del proyecto institucional a cada actividad.",
                accent: "text-amber-200/85",
              },
            ].map(({ icon: Icon, title, desc, accent }) => (
              <li
                key={title}
                className="flex gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 ring-1 ring-white/[0.04] backdrop-blur-sm transition-colors hover:border-white/[0.1] hover:bg-white/[0.05]"
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]",
                    accent
                  )}
                >
                  <Icon className="size-[1.125rem]" strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-zinc-100">{title}</span>
                  <span className="mt-0.5 block text-[0.8125rem] leading-snug text-zinc-500">{desc}</span>
                </span>
                <CheckCircle2
                  className="mt-1 size-4 shrink-0 text-emerald-500/50 opacity-80"
                  strokeWidth={2}
                  aria-hidden
                />
              </li>
            ))}
          </ul>
        </div>

        {/* Card */}
        <div className="flex w-full flex-col justify-center lg:w-[min(100%,26.5rem)] lg:flex-none">
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-1 rounded-[1.35rem] bg-gradient-to-b from-primary/15 via-transparent to-primary/5 opacity-80 blur-xl"
            />
            <Card className="relative overflow-hidden rounded-[1.25rem] border-border/70 bg-card py-0 text-card-foreground shadow-lg shadow-black/25 ring-1 ring-border/40 backdrop-blur-sm dark:border-border/50 dark:shadow-none dark:ring-border/30">
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent"
              />
              <CardHeader className="space-y-2 border-b border-border/50 px-7 pb-5 pt-9 text-center sm:text-left">
                <div className="mx-auto mb-1 flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20 sm:mx-0">
                  <Sparkles className="size-5" strokeWidth={2} />
                </div>
                <CardTitle className="text-[1.35rem] font-semibold tracking-tight text-foreground">
                  Bienvenido de nuevo
                </CardTitle>
                <CardDescription className="text-[0.9375rem] leading-relaxed text-muted-foreground">
                  Ingresá con el correo y la contraseña de tu organización.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-7 px-7 pb-9 pt-6">
                <Suspense fallback={<LoginFormFallback />}>
                  <LoginForm />
                </Suspense>

                <p className="text-center text-[0.8125rem] leading-relaxed text-muted-foreground">
                  ¿Sin acceso?{" "}
                  <span className="font-medium text-foreground">Pedí una cuenta a tu administrador.</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <footer className="relative z-10 border-t border-white/[0.06] px-6 py-5 text-center">
        <p className="text-[0.75rem] text-zinc-500">
          <span className="font-medium text-zinc-400">OKR Stack</span>
          <span className="mx-2 text-zinc-700">·</span>
          <span>Multiempresa profesional</span>
          <span className="mx-2 text-zinc-700">·</span>
          <span className="text-zinc-600">© {new Date().getFullYear()}</span>
        </p>
      </footer>
    </div>
  );
}
