import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  CalendarRange,
  Compass,
  Factory,
  Gauge,
  GitBranch,
  Layers,
  LayoutDashboard,
  LineChart,
  Percent,
  Shield,
  Smartphone,
  SquareChartGantt,
  Target,
  Users,
  Users2,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  layers: Layers,
  percent: Percent,
  gauge: Gauge,
  shield: Shield,
  "line-chart": LineChart,
  "git-branch": GitBranch,
  smartphone: Smartphone,
  target: Target,
  "calendar-range": CalendarRange,
  "layout-dashboard": LayoutDashboard,
  "building-2": Building2,
  "bar-chart-3": BarChart3,
  "square-chart-gantt": SquareChartGantt,
  users: Users,
  factory: Factory,
  compass: Compass,
  "users-2": Users2,
};

export const LANDING_ICON_OPTIONS: { value: string; label: string }[] = [
  { value: "layers", label: "Capas" },
  { value: "percent", label: "Porcentaje" },
  { value: "gauge", label: "Medidor" },
  { value: "shield", label: "Escudo" },
  { value: "line-chart", label: "Gráfico de línea" },
  { value: "git-branch", label: "Ramas" },
  { value: "smartphone", label: "Móvil" },
  { value: "target", label: "Objetivo" },
  { value: "calendar-range", label: "Calendario" },
  { value: "layout-dashboard", label: "Tablero" },
  { value: "building-2", label: "Empresa" },
  { value: "bar-chart-3", label: "Barras" },
  { value: "square-chart-gantt", label: "Gantt" },
  { value: "users", label: "Personas" },
  { value: "factory", label: "Industria" },
  { value: "compass", label: "Brújula" },
  { value: "users-2", label: "Equipos" },
];

export function getLandingIcon(key: string): LucideIcon {
  return ICON_MAP[key] ?? Layers;
}
