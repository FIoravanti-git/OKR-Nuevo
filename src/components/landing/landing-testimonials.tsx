import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LandingPageConfig } from "@/lib/landing-config/types";

type Props = {
  config: LandingPageConfig["testimonials"];
};

export function LandingTestimonials({ config }: Props) {
  return (
    <section id="testimonios" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">{config.eyebrow}</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{config.title}</h2>
          {config.subtitle ? <p className="mt-4 text-sm text-muted-foreground">{config.subtitle}</p> : null}
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {config.items.map((q) => (
            <Card key={q.id} className="border-border/60 bg-card/80 dark:bg-card/45">
              <CardContent className="pt-6">
                <Quote className="size-8 text-primary/40" />
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">“{q.comment}”</p>
                <div className="mt-6 border-t border-border/60 pt-4">
                  <p className="text-sm font-semibold">{q.name}</p>
                  <p className="text-xs text-muted-foreground">{q.roleCompany}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
