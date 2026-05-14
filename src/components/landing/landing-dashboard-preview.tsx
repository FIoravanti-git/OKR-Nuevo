import { Badge } from "@/components/ui/badge";

export function LandingDashboardPreview() {
  return (
    <section id="producto" className="scroll-mt-20 border-y border-border/60 bg-muted/20 py-16 sm:py-20 dark:bg-muted/5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Vista previa</p>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Un tablero que tu dirección va a querer abrir todos los lunes
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Progreso consolidado, foco en áreas y lectura de riesgos en segundos. Así se ve cuando estrategia y operación comparten el mismo lenguaje.
            </p>
          </div>
          <Badge variant="outline" className="w-fit font-medium">
            Mock visual · no requiere datos reales
          </Badge>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-12">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm lg:col-span-5 dark:bg-card/50">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progreso general</p>
            <div className="mt-4 flex items-end gap-6">
              <div className="relative grid size-36 place-items-center">
                <div className="absolute inset-0 rounded-full border-8 border-muted" />
                <div
                  className="absolute inset-0 rounded-full border-8 border-primary border-r-transparent border-b-transparent"
                  style={{ transform: "rotate(-35deg)" }}
                />
                <span className="font-heading text-3xl font-semibold">68%</span>
              </div>
              <div className="flex-1 space-y-3">
                {[
                  { label: "On track", w: "72%", tone: "bg-kr-health-good/85" },
                  { label: "Atención", w: "18%", tone: "bg-kr-health-warn/85" },
                  { label: "Crítico", w: "10%", tone: "bg-destructive/70" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="mb-1 flex justify-between text-xs font-medium text-muted-foreground">
                      <span>{row.label}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${row.tone}`} style={{ width: row.w }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm dark:bg-card/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Áreas</p>
              <ul className="mt-4 space-y-3">
                {[
                  { name: "Operaciones", v: 78 },
                  { name: "Producto & Tech", v: 64 },
                  { name: "Revenue", v: 82 },
                  { name: "People", v: 71 },
                ].map((a) => (
                  <li key={a.name} className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{a.name}</span>
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary/70" style={{ width: `${a.v}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs font-semibold text-muted-foreground">{a.v}%</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm dark:bg-card/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">KR destacados</p>
              <div className="mt-4 space-y-3">
                {[
                  { t: "NPS trimestral ≥ 45", s: "En curso", dot: "bg-chart-2" },
                  { t: "Churn bajo 2,2%", s: "Riesgo", dot: "bg-kr-health-warn" },
                  { t: "Time-to-value −20%", s: "On track", dot: "bg-kr-health-good" },
                ].map((kr) => (
                  <div key={kr.t} className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/25 p-3 dark:bg-muted/15">
                    <span className={`mt-1 size-2 shrink-0 rounded-full ${kr.dot}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug">{kr.t}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{kr.s}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:col-span-2 dark:bg-card/50">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actividades · próximos hitos</p>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[0.625rem] font-semibold text-primary">Dependencias</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { t: "Kickoff pricing", d: "Mar 12", p: "90%" },
                  { t: "Integración BI", d: "Mar 18", p: "45%" },
                  { t: "Playbook ventas", d: "Mar 22", p: "60%" },
                ].map((x) => (
                  <div key={x.t} className="rounded-xl border border-border/50 bg-muted/20 p-3 dark:bg-muted/10">
                    <p className="text-sm font-semibold">{x.t}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{x.d}</p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary/70" style={{ width: x.p }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
