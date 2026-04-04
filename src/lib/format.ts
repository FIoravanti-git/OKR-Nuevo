import type { KeyResultProgressHealthLevel } from "@/lib/key-results/progress-health";
import { keyResultProgressHealthFromPercent } from "@/lib/key-results/progress-health";

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getUTCFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  return `${formatDate(date)} ${hh}:${min}`;
}

export function formatAmount(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: "Super administrador",
    ADMIN_EMPRESA: "Admin empresa",
    OPERADOR: "Operador",
  };
  return map[role] ?? role;
}

export function institutionalObjectiveStatusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "Borrador",
    ACTIVE: "Activo",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
  };
  return map[status] ?? status;
}

export function strategicObjectiveStatusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "Borrador",
    ACTIVE: "Activo",
    AT_RISK: "En riesgo",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
  };
  return map[status] ?? status;
}

export function keyResultStatusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "Borrador",
    ON_TRACK: "En curso",
    AT_RISK: "En riesgo",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
  };
  return map[status] ?? status;
}

/** Etiqueta del semáforo por % de avance (&lt;30%, 30–70%, &gt;70%). */
export function keyResultProgressHealthLabel(level: KeyResultProgressHealthLevel): string {
  const map: Record<KeyResultProgressHealthLevel, string> = {
    EN_RIESGO: "En riesgo",
    EN_ATENCION: "En atención",
    EN_BUEN_ESTADO: "En buen estado",
  };
  return map[level];
}

/** Texto para búsqueda / filtros (vacío si no hay porcentaje). */
export function keyResultProgressHealthSearchText(progressPercent: number | null): string {
  const l = keyResultProgressHealthFromPercent(progressPercent);
  return l ? keyResultProgressHealthLabel(l) : "";
}

export function keyResultMetricTypeLabel(t: string): string {
  const map: Record<string, string> = {
    NUMBER: "Número",
    PERCENT: "Porcentaje",
    CURRENCY: "Moneda",
    COUNT: "Conteo",
    CUSTOM: "Personalizado",
  };
  return map[t] ?? t;
}

export function keyResultCalculationModeLabel(m: string): string {
  const map: Record<string, string> = {
    MANUAL: "Manual",
    AUTOMATIC: "Automático",
    HYBRID: "Híbrido",
  };
  return map[m] ?? m;
}

export function keyResultTargetDirectionLabel(direction: string): string {
  const map: Record<string, string> = {
    ASCENDENTE: "Ascendente (mayor es mejor)",
    DESCENDENTE: "Descendente (menor es mejor)",
  };
  return map[direction] ?? direction;
}

export function progressCalculationModeLabel(m: string): string {
  const map: Record<string, string> = {
    WEIGHTED_AVERAGE: "Promedio ponderado",
    SUM_NORMALIZED: "Suma normalizada",
    MAX_OF_CHILDREN: "Máximo de hijos",
    MIN_OF_CHILDREN: "Mínimo de hijos",
    MANUAL_OVERRIDE: "Sin agregado desde actividades",
  };
  return map[m] ?? m;
}

export function institutionalProjectStatusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "Borrador",
    ACTIVE: "Activo",
    ARCHIVED: "Archivado",
  };
  return map[status] ?? status;
}

export function activityStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PLANNED: "Planificada",
    IN_PROGRESS: "En progreso",
    DONE: "Hecha",
    BLOCKED: "Bloqueada",
    CANCELLED: "Cancelada",
  };
  return map[status] ?? status;
}

/** Actividad con vencimiento anterior a hoy y estado distinto de Hecha. */
export function activityOverdueLabel(): string {
  return "Vencida";
}

export function keyResultProgressLogSourceLabel(source: string): string {
  const map: Record<string, string> = {
    FORM_SAVE: "Edición del formulario",
    STATUS_CHANGE: "Cambio de estado",
    RECALCULATE: "Recálculo automático",
  };
  return map[source] ?? source;
}

export function areaStatusLabel(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: "Activa",
    INACTIVE: "Inactiva",
  };
  return map[status] ?? status;
}

/** Texto compacto para listados: "Ana", "Ana y Luis", "Ana, Luis y 2 más". */
export function formatResponsablesList(names: string[]): string {
  const n = names.map((s) => s.trim()).filter(Boolean);
  if (n.length === 0) return "";
  if (n.length === 1) return n[0]!;
  if (n.length === 2) return `${n[0]} y ${n[1]}`;
  return `${n[0]}, ${n[1]} y ${n.length - 2} más`;
}
