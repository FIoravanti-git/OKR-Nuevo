/**
 * Cálculos de avance con ponderaciones para la jerarquía OKR.
 * Actividades → Resultado clave → Objetivo clave → Objetivo institucional.
 */

export type ActivityInput = {
  impactsProgress: boolean;
  contributionWeight: number;
  /** Avance aportado por la actividad (típico 0–100). */
  progressContribution: number | null;
};

export type WeightedValue = {
  weight: number;
  value: number;
};

/**
 * Promedio ponderado de actividades que impactan el resultado clave.
 * Solo entran filas con `impactsProgress === true` y `progressContribution` definido.
 */
export function aggregateKeyResultFromActivities(activities: ActivityInput[]): number {
  const relevant = activities.filter(
    (a) => a.impactsProgress && a.progressContribution != null
  );
  if (relevant.length === 0) return 0;

  const totalWeight = relevant.reduce((s, a) => s + a.contributionWeight, 0);
  if (totalWeight === 0) return 0;

  return (
    relevant.reduce(
      (s, a) => s + (a.progressContribution as number) * a.contributionWeight,
      0
    ) / totalWeight
  );
}

/** Promedio ponderado genérico (resultados clave → objetivo clave, etc.). */
export function weightedAverage(items: WeightedValue[]): number {
  if (items.length === 0) return 0;
  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  if (totalWeight === 0) return 0;
  return items.reduce((s, i) => s + i.value * i.weight, 0) / totalWeight;
}

/**
 * Avance de un resultado clave a partir de valor actual vs meta (alternativa a actividades).
 * Devuelve 0–100 si ambos valores existen y target > 0.
 */
export function ratioProgress(current: number | null, target: number | null): number | null {
  if (current == null || target == null || target === 0) return null;
  return Math.min(100, Math.max(0, (current / target) * 100));
}
