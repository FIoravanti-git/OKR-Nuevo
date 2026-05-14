import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  {
    name: "Starter",
    price: "USD 49",
    period: "/mes",
    description: "Equipos que recién estructuran OKRs y necesitan foco sin fricción.",
    features: ["Hasta 10 usuarios", "Dashboard básico", "Gestión OKR completa", "Soporte estándar (ticket)"],
    cta: "Comenzar ahora",
    href: "/login",
    variant: "outline" as const,
    highlight: false,
  },
  {
    name: "Business",
    price: "USD 149",
    period: "/mes",
    description: "Empresas en crecimiento con varias áreas y reporting a dirección.",
    features: [
      "Hasta 50 usuarios",
      "Áreas y responsables",
      "Reportes ejecutivos",
      "Dashboard avanzado",
      "PWA / app instalable",
      "Soporte prioritario",
    ],
    cta: "Solicitar demo",
    href: "#contacto",
    variant: "default" as const,
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Personalizado",
    period: "",
    description: "Grupos corporativos con integraciones, gobernanza y acompañamiento dedicado.",
    features: [
      "Usuarios ilimitados",
      "Personalización y marca",
      "Onboarding a medida",
      "Soporte dedicado",
      "Módulos avanzados",
      "Integración empresarial (SSO, API, etc.)",
    ],
    cta: "Hablar con ventas",
    href: "mailto:ventas@okrstack.com?subject=OKR%20Stack%20Enterprise",
    variant: "outline" as const,
    highlight: false,
  },
];

export function LandingPricing() {
  return (
    <section id="planes" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Planes y precios</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Inversión clara, valor medible
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">
            Elegí el punto de partida. Migrá de plan cuando tu organización escala sin rearmar todo desde cero.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.highlight
                  ? "relative border-primary/40 bg-gradient-to-b from-primary/10 via-card to-card shadow-lg shadow-primary/10 ring-1 ring-primary/20 dark:from-primary/15 dark:shadow-primary/5"
                  : "border-border/60 bg-card/80 dark:bg-card/45"
              }
            >
              {plan.highlight ? (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 font-semibold">Más elegido</Badge>
              ) : null}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-2">
                  <span className="font-heading text-4xl font-semibold tracking-tight">{plan.price}</span>
                  {plan.period ? (
                    <span className="text-muted-foreground">{plan.period}</span>
                  ) : null}
                </div>
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
              <CardFooter className="flex-col gap-2 sm:flex-row">
                {plan.href.startsWith("mailto:") ? (
                  <Button
                    className="w-full"
                    variant={plan.variant}
                    size="lg"
                    nativeButton={false}
                    render={<a href={plan.href} />}
                  >
                    {plan.cta}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.variant}
                    size="lg"
                    nativeButton={false}
                    render={<Link href={plan.href} />}
                  >
                    {plan.cta}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
