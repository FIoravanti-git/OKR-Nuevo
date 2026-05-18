import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLandingIcon } from "@/lib/landing-config/icons";
import type { LandingPageConfig } from "@/lib/landing-config/types";

type Props = {
  config: LandingPageConfig["features"];
};

export function LandingFeatures({ config }: Props) {
  return (
    <section id="funcionalidades" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">{config.eyebrow}</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{config.title}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">{config.subtitle}</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {config.items.map((f) => {
            const Icon = getLandingIcon(f.iconKey);
            return (
              <Card
                key={f.id}
                className="border-border/60 bg-card/70 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-primary/25 dark:bg-card/45"
              >
                <CardHeader>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                  <CardDescription className="text-[0.8125rem] leading-relaxed">{f.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
