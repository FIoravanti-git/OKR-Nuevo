/**
 * Semáforo de avance para resultados clave (derivado solo del % consolidado).
 * No reemplaza el estado operativo (`KeyResultStatus`) almacenado en BD.
 */
export type KeyResultProgressHealthLevel = "EN_RIESGO" | "EN_ATENCION" | "EN_BUEN_ESTADO";

export function keyResultProgressHealthFromPercent(
  progressPercent: number | null | undefined
): KeyResultProgressHealthLevel | null {
  if (progressPercent == null || Number.isNaN(Number(progressPercent))) return null;
  const p = Number(progressPercent);
  if (p < 30) return "EN_RIESGO";
  if (p <= 70) return "EN_ATENCION";
  return "EN_BUEN_ESTADO";
}

/** Relleno de barras Recharts (variables CSS del tema donde aplica). */
export function keyResultProgressHealthChartFill(
  progressPercent: number | null | undefined
): string {
  const h = keyResultProgressHealthFromPercent(progressPercent);
  if (h === "EN_RIESGO") return "var(--destructive)";
  if (h === "EN_ATENCION") return "var(--kr-health-warn)";
  if (h === "EN_BUEN_ESTADO") return "var(--kr-health-good)";
  return "var(--muted-foreground)";
}
