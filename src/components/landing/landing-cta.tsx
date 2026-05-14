import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingCta() {
  return (
    <section id="contacto" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-card px-6 py-12 shadow-xl shadow-primary/10 sm:px-10 sm:py-14 dark:from-primary/20 dark:via-card dark:to-card">
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/20 blur-3xl dark:bg-primary/10" />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Agendá una demo guiada con tu caso de uso
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">
              Te mostramos OKR Stack con datos de ejemplo o, si preferís, armamos un recorrido sobre tus áreas y roles reales bajo NDA.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="h-11 min-w-[200px] px-6" nativeButton={false} render={<a href="mailto:ventas@okrstack.com?subject=Demo%20OKR%20Stack" />}>
                Solicitar demo por correo
                <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline" className="h-11 min-w-[200px] px-6" nativeButton={false} render={<Link href="/login" />}>
                Comenzar ahora
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground sm:text-sm">
              Respuesta en menos de 24 h hábiles · demos en español · facturación internacional disponible
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
