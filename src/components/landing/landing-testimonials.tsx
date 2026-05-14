import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const quotes = [
  {
    name: "Mariana Vidal",
    role: "COO · Grupo Andina Retail",
    body: "Pasamos de reuniones reactivas a un comité semanal con los mismos números para todos. El salto fue tener dependencias explícitas entre equipos.",
  },
  {
    name: "Lucas Ferreyra",
    role: "Director de Operaciones · Logística SUR",
    body: "Probamos hojas y Notion; se desincronizaban. Con OKR Stack el área ve su avance y dirección ve el consolidado sin armar otro Excel.",
  },
  {
    name: "Paula Méndez",
    role: "Chief of Staff · Fintech PagoRápido",
    body: "La PWA nos salvó en viajes y visitas a socios. Instalás la app y tenés el tablero como si fuera herramienta interna, no un sitio web olvidado.",
  },
];

export function LandingTestimonials() {
  return (
    <section id="testimonios" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Testimonios</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Equipos que ya no confunden actividad con impacto
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">Referencias simuladas con fines demostrativos.</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {quotes.map((q) => (
            <Card key={q.name} className="border-border/60 bg-card/80 dark:bg-card/45">
              <CardContent className="pt-6">
                <Quote className="size-8 text-primary/40" />
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">“{q.body}”</p>
                <div className="mt-6 border-t border-border/60 pt-4">
                  <p className="text-sm font-semibold">{q.name}</p>
                  <p className="text-xs text-muted-foreground">{q.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
