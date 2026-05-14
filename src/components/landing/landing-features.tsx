import {
  BarChart3,
  Building2,
  CalendarRange,
  SquareChartGantt,
  LayoutDashboard,
  Smartphone,
  Target,
  Users,
} from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Target,
    title: "Objetivos y KR",
    description: "Objetivos institucionales, objetivos clave y resultados clave con métricas, metas y ponderación coherente.",
  },
  {
    icon: CalendarRange,
    title: "Actividades",
    description: "Desglose accionable con responsables, fechas y estado: la ejecución queda atada a los OKR.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard ejecutivo",
    description: "Resumen visual de avance, áreas y salud de progreso para decisiones rápidas en comité.",
  },
  {
    icon: Building2,
    title: "Gestión por áreas",
    description: "Estructura por departamentos con responsables y contexto multiempresa cuando lo necesitás.",
  },
  {
    icon: BarChart3,
    title: "Reportes",
    description: "Lectura por área y cortes ejecutivos para auditorías internas y seguimiento de management.",
  },
  {
    icon: SquareChartGantt,
    title: "Gantt semanal",
    description: "Planificación compacta de la semana con foco en dependencias y entregables críticos.",
  },
  {
    icon: Users,
    title: "Seguimiento trimestral",
    description: "Ritmo de negocio alineado al calendario corporativo: checkpoints sin perder agilidad.",
  },
  {
    icon: Smartphone,
    title: "PWA / App empresarial",
    description: "Instalación en escritorio y móvil, acceso rápido y experiencia similar a app nativa.",
  },
];

export function LandingFeatures() {
  return (
    <section id="funcionalidades" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Funcionalidades</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Todo lo que esperás de un stack OKR serio
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">
            Un solo lugar para planificar, ponderar, ejecutar y reportar. Sin hojas sueltas ni versiones desactualizadas.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card
              key={f.title}
              className="border-border/60 bg-card/70 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-primary/25 dark:bg-card/45"
            >
              <CardHeader>
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-4" />
                </div>
                <CardTitle className="text-base">{f.title}</CardTitle>
                <CardDescription className="text-[0.8125rem] leading-relaxed">{f.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
