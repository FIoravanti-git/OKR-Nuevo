import type { ProgressCalculationMode } from "@/generated/prisma";

/** Modos en los que los pesos de las actividades afectan el agregado numéricamente (promedio / suma normalizada). */
export function keyResultUsesWeightedActivityAggregation(mode: ProgressCalculationMode): boolean {
  return mode === "WEIGHTED_AVERAGE" || mode === "SUM_NORMALIZED";
}

/** Valor inicial del campo de peso en el formulario según impacto y modo del KR. */
export function defaultActivityContributionWeightInput(
  impactsProgress: boolean,
  progressMode: ProgressCalculationMode,
  storedWeight: number
): string {
  if (!impactsProgress) return "";
  if (!keyResultUsesWeightedActivityAggregation(progressMode)) return "1";
  return String(storedWeight > 0 ? storedWeight : 1);
}
