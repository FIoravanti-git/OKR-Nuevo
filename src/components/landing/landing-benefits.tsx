import { Gauge, GitBranch, Layers, LineChart, Percent, Shield, Smartphone } from "lucide-react";

const items = [
  {
    icon: Layers,
    title: "Alineación estratégica",
    body: "Conectá objetivos institucionales con la operación: cada KR y actividad aporta al mismo norte medible.",
  },
  {
    icon: Percent,
    title: "Métricas y ponderaciones",
    body: "Pesos explícitos y lectura de impacto: lo importante pesa más, sin debates interminables sobre prioridades.",
  },
  {
    icon: Gauge,
    title: "Seguimiento en tiempo real",
    body: "Avances, ponderaciones y salud de progreso visibles para líderes y equipos sin depender de reportes manuales.",
  },
  {
    icon: Shield,
    title: "Control por áreas",
    body: "Departamentos, responsables y permisos claros: gobernanza real para empresas con varias líneas de negocio.",
  },
  {
    icon: LineChart,
    title: "Dashboards ejecutivos",
    body: "Lectura rápida del estado del trimestre: foco en riesgos, cuellos de botella y oportunidades de recuperación.",
  },
  {
    icon: GitBranch,
    title: "Dependencias y planificación",
    body: "Actividades enlazadas con orden y secuencia: menos sorpresas, más previsibilidad en la ejecución.",
  },
  {
    icon: Smartphone,
    title: "En cualquier dispositivo",
    body: "Experiencia responsive e instalable como PWA para reuniones, planta o trabajo híbrido.",
  },
];

export function LandingBenefits() {
  return (
    <section id="beneficios" className="scroll-mt-20 border-y border-border/60 bg-muted/25 py-16 sm:py-20 dark:bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Beneficios</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            De la hoja de ruta al tablero semanal, sin perder el hilo
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            OKR Stack está pensado para organizaciones que necesitan claridad estratégica y disciplina operativa al mismo tiempo.
          </p>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.title}
              className="group rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-card/40"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <item.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
