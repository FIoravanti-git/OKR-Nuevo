import { Badge } from "@/components/ui/badge";
import type { LandingPageConfig } from "@/lib/landing-config/types";

type Props = {
  config: LandingPageConfig["preview"];
};

export function LandingDashboardPreview({ config }: Props) {
  return (
    <section id="producto" className="scroll-mt-20 border-y border-border/60 bg-muted/20 py-16 sm:py-20 dark:bg-muted/5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">{config.eyebrow}</p>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{config.title}</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">{config.subtitle}</p>
          </div>
          {config.badgeText ? (
            <Badge variant="outline" className="w-fit font-medium">
              {config.badgeText}
            </Badge>
          ) : null}
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
                <span className="font-heading text-3xl font-semibold">{config.progressPercent}</span>
              </div>
              <div className="flex-1 space-y-3">
                {config.bars.map((row) => (
                  <div key={row.label}>
                    <div className="mb-1 flex justify-between text-xs font-medium text-muted-foreground">
                      <span>{row.label}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${row.tone}`} style={{ width: row.width }} />
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
                {config.areas.map((a) => (
                  <li key={a.name} className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{a.name}</span>
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary/70" style={{ width: `${a.value}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs font-semibold text-muted-foreground">{a.value}%</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm dark:bg-card/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">KR destacados</p>
              <div className="mt-4 space-y-3">
                {config.krs.map((kr) => (
                  <div key={kr.title} className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/25 p-3 dark:bg-muted/15">
                    <span className={`mt-1 size-2 shrink-0 rounded-full ${kr.dot}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug">{kr.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{kr.status}</p>
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
                {config.activities.map((x) => (
                  <div key={x.title} className="rounded-xl border border-border/50 bg-muted/20 p-3 dark:bg-muted/10">
                    <p className="text-sm font-semibold">{x.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{x.date}</p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary/70" style={{ width: x.progress }} />
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
