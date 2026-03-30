/**
 * Cálculo de avance por métricas (sin dependencias de servidor).
 *
 * Usa `valor_inicial` (ausente → 0), `valor_actual`, `valor_meta` y `direccion_meta`:
 * - **ASCENDENTE**: avance lineal de inicial → meta.
 * - **DESCENDENTE**: avance lineal cuando la meta es menor que el punto de partida (p. ej. reducir costos).
 *
 * Si |meta − inicial| ≈ 0, no hay división por cero: se devuelve 100 si el actual alcanza la meta, si no 0.
 * El resultado se acota a **[0, 100]**.
 */
export function linearMetricProgress(
  initialValue: number | null | undefined,
  currentValue: number | null | undefined,
  targetValue: number | null | undefined,
  targetDirection: "ASCENDENTE" | "DESCENDENTE" = "ASCENDENTE"
): number | null {
  if (currentValue == null || targetValue == null) return null;
  const i = initialValue ?? 0;
  const c = Number(currentValue);
  const t = Number(targetValue);

  const span =
    targetDirection === "DESCENDENTE"
      ? i - t
      : t - i;
  if (Math.abs(span) < 1e-12) {
    const reached =
      targetDirection === "DESCENDENTE"
        ? c <= t
        : c >= t;
    return reached ? 100 : 0;
  }
  const raw =
    targetDirection === "DESCENDENTE"
      ? (i - c) / span
      : (c - i) / span;
  const p = raw * 100;
  return Math.min(100, Math.max(0, Number.isFinite(p) ? p : 0));
}
