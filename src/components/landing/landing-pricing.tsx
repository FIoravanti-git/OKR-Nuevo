import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { LandingPageConfig } from "@/lib/landing-config/types";

type Props = {
  config: LandingPageConfig["pricing"];
};

export function LandingPricing({ config }: Props) {
  return (
    <section id="planes" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">{config.eyebrow}</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{config.title}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">{config.subtitle}</p>
        </div>

        <div className="mt-12 grid items-stretch gap-8 sm:gap-6 lg:grid-cols-3">
          {config.plans.map((plan) => {
            const variant = plan.isHighlighted ? ("default" as const) : ("outline" as const);
            const showBadge = plan.isHighlighted && plan.highlightLabel;

            return (
              <div key={plan.id} className="relative flex h-full flex-col pt-7">
                {showBadge ? (
                  <Badge
                    className="absolute top-0 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap px-3 py-1 font-semibold shadow-md ring-1 ring-primary/20"
                  >
                    {plan.highlightLabel}
                  </Badge>
                ) : null}
                <Card
                  className={
                    plan.isHighlighted
                      ? "flex h-full flex-col border-primary/40 bg-gradient-to-b from-primary/10 via-card to-card shadow-lg shadow-primary/10 ring-1 ring-primary/20 dark:from-primary/15 dark:shadow-primary/5"
                      : "flex h-full flex-col border-border/60 bg-card/80 dark:bg-card/45"
                  }
                >
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    {plan.showPrice ? (
                      <div className="pt-2">
                        <span className="font-heading text-4xl font-semibold tracking-tight">{plan.priceLabel}</span>
                        {plan.periodLabel ? <span className="text-muted-foreground">{plan.periodLabel}</span> : null}
                      </div>
                    ) : null}
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex gap-2 text-sm text-muted-foreground">
                          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="mt-auto flex-col gap-2 sm:flex-row">
                    {plan.buttonUrl.startsWith("mailto:") ? (
                      <Button className="w-full" variant={variant} size="lg" nativeButton={false} render={<a href={plan.buttonUrl} />}>
                        {plan.buttonText}
                      </Button>
                    ) : (
                      <Button className="w-full" variant={variant} size="lg" nativeButton={false} render={<Link href={plan.buttonUrl} />}>
                        {plan.buttonText}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
