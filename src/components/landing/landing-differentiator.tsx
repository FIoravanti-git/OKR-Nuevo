import { getLandingIcon } from "@/lib/landing-config/icons";
import type { LandingPageConfig } from "@/lib/landing-config/types";

type Props = {
  config: LandingPageConfig["differentiator"];
};

export function LandingDifferentiator({ config }: Props) {
  return (
    <section id="diferencial" className="scroll-mt-20 border-y border-border/60 bg-muted/25 py-16 sm:py-20 dark:bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">{config.eyebrow}</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{config.title}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{config.subtitle}</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {config.points.map((b) => {
            const Icon = getLandingIcon(b.iconKey);
            return (
              <div key={b.id} className="flex gap-4 rounded-2xl border border-border/60 bg-card/90 p-6 shadow-sm dark:bg-card/40">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold tracking-tight">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
