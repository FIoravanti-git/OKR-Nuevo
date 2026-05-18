import { getLandingIcon } from "@/lib/landing-config/icons";
import type { LandingPageConfig } from "@/lib/landing-config/types";

type Props = {
  config: LandingPageConfig["benefits"];
};

export function LandingBenefits({ config }: Props) {
  return (
    <section id="beneficios" className="scroll-mt-20 border-y border-border/60 bg-muted/25 py-16 sm:py-20 dark:bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">{config.eyebrow}</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{config.title}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{config.subtitle}</p>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {config.items.map((item) => {
            const Icon = getLandingIcon(item.iconKey);
            return (
              <li
                key={item.id}
                className="group rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-card/40"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
