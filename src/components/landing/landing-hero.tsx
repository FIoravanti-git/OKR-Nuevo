import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-24 lg:pt-32 lg:pb-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-1/4 top-0 h-[420px] w-[70%] rounded-full bg-primary/20 blur-3xl dark:bg-primary/12" />
        <div className="absolute -right-1/4 bottom-0 h-[380px] w-[60%] rounded-full bg-chart-2/25 blur-3xl dark:bg-chart-2/15" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)]" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:px-8">
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-700">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 border border-border/60 font-semibold">
              <Sparkles className="size-3" />
              Instalable como app (PWA)
            </Badge>
            <Badge variant="outline" className="font-medium">
              Multiempresa · Roles y permisos
            </Badge>
          </div>

          <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            OKR Stack: estrategia que se ejecuta, no que se archiva.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
            La plataforma empresarial para alinear objetivos institucionales, resultados clave y actividades
            con métricas, ponderaciones y visibilidad ejecutiva en tiempo real.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button size="lg" className="h-11 px-6 shadow-md shadow-primary/15" nativeButton={false} render={<Link href="#contacto" />}>
              Solicitar demo
              <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-11 px-6" nativeButton={false} render={<Link href="/login" />}>
              Iniciar sesión
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground sm:text-sm">
            Onboarding guiado · Seguridad pensada para equipos distribuidos · Experiencia tipo app en móvil y escritorio
          </p>
        </div>

        <HeroDashboardMock />
      </div>
    </section>
  );
}

function HeroDashboardMock() {
  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both [animation-delay:120ms] lg:justify-self-end"
      aria-hidden
    >
      <div className="relative rounded-2xl border border-border/70 bg-card/80 p-1 shadow-2xl shadow-black/10 ring-1 ring-border/40 backdrop-blur-sm dark:bg-card/50 dark:shadow-black/40">
        <div className="flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-muted/40 px-3 py-2.5 dark:bg-muted/25">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-destructive/70" />
            <span className="size-2.5 rounded-full bg-chart-3/80" />
            <span className="size-2.5 rounded-full bg-kr-health-good/80" />
          </div>
          <div className="h-2 w-28 rounded-full bg-muted-foreground/15" />
          <div className="h-6 w-6 rounded-md bg-primary/20" />
        </div>

        <div className="mt-2 grid gap-2 rounded-xl bg-gradient-to-b from-background/90 to-muted/30 p-3 sm:p-4 dark:from-background/40 dark:to-muted/15">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground">Avance trimestre</p>
              <p className="font-heading text-2xl font-semibold tracking-tight">72%</p>
            </div>
            <div className="flex gap-2">
              <span className="rounded-lg border border-border/60 bg-background/80 px-2.5 py-1 text-[0.6875rem] font-medium text-muted-foreground">
                Áreas
              </span>
              <span className="rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1 text-[0.6875rem] font-semibold text-primary">
                KR críticos
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
              <p className="text-[0.6875rem] font-medium text-muted-foreground">OI activos</p>
              <p className="mt-1 text-lg font-semibold">14</p>
              <div className="mt-3 h-10 rounded-md bg-gradient-to-t from-primary/25 to-transparent" />
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
              <p className="text-[0.6875rem] font-medium text-muted-foreground">KR en riesgo</p>
              <p className="mt-1 text-lg font-semibold text-destructive">3</p>
              <div className="mt-3 flex items-end gap-1">
                {[40, 65, 30, 80, 55].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-primary/30" style={{ height: `${h}%`, minHeight: "0.75rem" }} />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
              <p className="text-[0.6875rem] font-medium text-muted-foreground">Actividades</p>
              <p className="mt-1 text-lg font-semibold">128</p>
              <div className="mt-3 space-y-1.5">
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div className="h-full w-4/5 rounded-full bg-kr-health-good/80" />
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div className="h-full w-3/5 rounded-full bg-chart-2/80" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-3 dark:bg-muted/10">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground">Dependencias · semana actual</p>
              <span className="rounded-md bg-background/80 px-2 py-0.5 text-[0.625rem] font-medium text-muted-foreground">
                Gantt
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-[0.625rem] font-medium text-muted-foreground">
              {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                <div key={d} className="text-center">
                  {d}
                </div>
              ))}
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-2 flex-[2] rounded-sm bg-primary/70" />
                <div className="h-2 flex-1 rounded-sm bg-muted-foreground/20" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-4 rounded-sm bg-transparent" />
                <div className="h-2 flex-[3] rounded-sm bg-chart-2/70" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 rounded-sm bg-muted-foreground/15" />
                <div className="h-2 flex-[2] rounded-sm bg-kr-health-good/70" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
