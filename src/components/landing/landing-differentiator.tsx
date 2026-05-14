import { Compass, Factory, LineChart, Users2 } from "lucide-react";

const blocks = [
  {
    icon: Factory,
    title: "Enfoque empresarial real",
    body: "No es un tablero genérico: está pensado para jerarquías, áreas y responsables como operan las compañías medianas y grandes.",
  },
  {
    icon: Compass,
    title: "Planificación + ejecución",
    body: "Los OKR dejan de vivir en una slide: se traducen en actividades con dueños, fechas y dependencias visibles.",
  },
  {
    icon: Users2,
    title: "Control por áreas",
    body: "Cada líder ve su territorio con contexto global. Dirección mira el portafolio completo sin perder el detalle.",
  },
  {
    icon: LineChart,
    title: "Estratégico y operativo",
    body: "Seguimiento trimestral con ritmo semanal: conectás la ambición del board con el calendario del equipo.",
  },
];

export function LandingDifferentiator() {
  return (
    <section id="diferencial" className="scroll-mt-20 border-y border-border/60 bg-muted/25 py-16 sm:py-20 dark:bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Por qué OKR Stack</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Cuando la estrategia necesita dueños, fechas y evidencia
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Herramientas de tareas ayudan a ejecutar. OKR Stack suma la capa que explica por qué esa ejecución importa y cómo se acerca a la meta.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {blocks.map((b) => (
            <div
              key={b.title}
              className="flex gap-4 rounded-2xl border border-border/60 bg-card/90 p-6 shadow-sm dark:bg-card/40"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <b.icon className="size-5" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold tracking-tight">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
