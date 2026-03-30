/**
 * Motor de avance estratégico OKR (funciones puras, sin Prisma).
 *
 * ## Criterio de agregación (cadena)
 *
 * 1. **Actividades → Resultado clave (KR)**  
 *    Solo entran actividades con `impactsProgress` y `progressContribution` definido.  
 *    El **peso de impacto** es `contributionWeight`. Según `progressMode` del KR:
 *    - `WEIGHTED_AVERAGE` / `SUM_NORMALIZED`: promedio ponderado por ese peso.
 *    - `MAX_OF_CHILDREN` / `MIN_OF_CHILDREN`: máximo o mínimo del % aportado.
 *    - `MANUAL_OVERRIDE`: no se agregan actividades (`null` en esa parte).
 *
 * 2. **Trayectoria por métricas (KR)**  
 *    Con inicial / actual / meta numéricos y `target_direction` (ASCENDENTE o DESCENDENTE), el avance lineal
 *    se calcula en `linearMetricProgress` (sin división por cero si inicial ≈ meta), acotado a 0–100.
 *
 * 3. **Modos del KR (`calculationMode`)**  
 *    - **MANUAL**: el progreso mostrado es el valor almacenado (`progress_cached`); no se recalcula aquí.  
 *    - **AUTOMATIC**: usa la trayectoria por métricas si hay datos; si no, el agregado de actividades (si aplica).  
 *    - **HÍBRIDO**: si hay agregado válido desde actividades, se usa ese; si no, la trayectoria por métrica.
 *
 * 4. **KR → Objetivo clave**  
 *    Promedio ponderado de los `progress_cached` de los KR hijos usando el campo **peso** (`weight`) del KR.
 *
 * 5. **Objetivo clave → Objetivo institucional**  
 *    Promedio ponderado de los `progress_cached` de los objetivos clave hijos con su **peso**.
 *
 * 6. **Proyecto institucional**  
 *    Se persiste en `institutional_projects.progress_cached` como promedio ponderado de los objetivos
 *    institucionales (`computeProjectProgressFromInstitutionalObjectives`); se actualiza al cambiar cualquier IO.
 *
 * Los porcentajes se **acotan a [0, 100]**. Si no hay hijos con progreso válido, el resultado es `null` (sin dato consolidado).
 */

import type {
  KeyResultCalculationMode,
  KeyResultTargetDirection,
  ProgressCalculationMode,
} from "@/generated/prisma";
import { linearMetricProgress } from "@/lib/okr/metric-progress";
import { weightedAverage } from "@/lib/okr/weighted-rollups";

export type ActivityRollupInput = {
  impactsProgress: boolean;
  contributionWeight: number;
  progressContribution: number | null;
};

export type WeightedProgressChild = {
  weight: number;
  /** `null` = excluir del agregado (sin avance consolidado). */
  progress: number | null;
};

export function clampProgressPercent(n: number): number {
  return Math.min(100, Math.max(0, Number.isFinite(n) ? n : 0));
}

/**
 * Agregación de actividades hacia un único % según `progressMode` del KR.
 */
export function computeActivityRollupProgress(
  activities: ActivityRollupInput[],
  progressMode: ProgressCalculationMode,
  allowActivityImpact: boolean
): number | null {
  if (!allowActivityImpact || progressMode === "MANUAL_OVERRIDE") {
    return null;
  }

  const rel = activities.filter((a) => a.impactsProgress && a.progressContribution != null);
  if (rel.length === 0) return null;

  const nums = rel.map((a) => ({
    w: Math.max(0, a.contributionWeight),
    v: clampProgressPercent(a.progressContribution as number),
  }));

  const weightedAveragePercent = clampProgressPercent(
    weightedAverage(nums.map((x) => ({ weight: x.w, value: x.v })))
  );

  const sumNormalizedPercent = (() => {
    const totalWeight = nums.reduce((s, x) => s + x.w, 0);
    if (totalWeight <= 0) return 0;
    const normalized = nums.reduce((s, x) => s + x.w * (x.v / 100), 0) / totalWeight;
    return clampProgressPercent(normalized * 100);
  })();

  switch (progressMode) {
    case "WEIGHTED_AVERAGE":
      return weightedAveragePercent;
    case "SUM_NORMALIZED":
      return sumNormalizedPercent;
    case "MAX_OF_CHILDREN":
      return clampProgressPercent(Math.max(...nums.map((x) => x.v)));
    case "MIN_OF_CHILDREN":
      return clampProgressPercent(Math.min(...nums.map((x) => x.v)));
    default:
      return weightedAveragePercent;
  }
}

function resolveHybridProgress(
  valuePart: number | null,
  activityPart: number | null
): number | null {
  /* Híbrido requerido:
   * - si hay agregado desde actividades, usarlo
   * - si no hay actividades válidas, fallback a trayectoria por métrica
   */
  return activityPart ?? valuePart ?? null;
}

export type KeyResultProgressComputationInput = {
  calculationMode: KeyResultCalculationMode;
  /** Valor persistido; en MANUAL es la fuente de verdad. */
  storedProgressPercent: number | null;
  initialValue: number | null;
  currentValue: number | null;
  targetValue: number | null;
  targetDirection: KeyResultTargetDirection;
  allowActivityImpact: boolean;
  progressMode: ProgressCalculationMode;
  activities: ActivityRollupInput[];
};

/**
 * Calcula el progreso del KR sin persistir. En MANUAL devuelve `storedProgressPercent` (o null).
 */
export function computeKeyResultProgress(input: KeyResultProgressComputationInput): number | null {
  if (input.calculationMode === "MANUAL") {
    return input.storedProgressPercent != null && Number.isFinite(input.storedProgressPercent)
      ? clampProgressPercent(input.storedProgressPercent)
      : null;
  }

  const valuePart = linearMetricProgress(
    input.initialValue,
    input.currentValue,
    input.targetValue,
    input.targetDirection
  );

  const activityPart = computeActivityRollupProgress(
    input.activities,
    input.progressMode,
    input.allowActivityImpact
  );

  let combined: number | null;
  if (input.calculationMode === "AUTOMATIC") {
    combined = valuePart;
    if (combined == null && activityPart != null) {
      combined = activityPart;
    }
  } else {
    combined = resolveHybridProgress(valuePart, activityPart);
  }

  return combined == null ? null : clampProgressPercent(combined);
}

/**
 * Promedio ponderado de hijos con progreso conocido. Sin hijos válidos → `null`.
 */
export function computeWeightedChildRollup(children: WeightedProgressChild[]): number | null {
  const items = children
    .filter((c) => c.progress != null && Number.isFinite(c.progress))
    .map((c) => ({
      weight: Math.max(0, c.weight),
      value: clampProgressPercent(c.progress as number),
    }));
  if (items.length === 0) return null;
  return clampProgressPercent(weightedAverage(items));
}

/** Alias semántico: KRs → objetivo clave. */
export function computeStrategicObjectiveProgressFromKeyResults(
  keyResults: WeightedProgressChild[]
): number | null {
  return computeWeightedChildRollup(keyResults);
}

/** Alias semántico: objetivos clave → objetivo institucional. */
export function computeInstitutionalObjectiveProgressFromStrategicObjectives(
  strategicObjectives: WeightedProgressChild[]
): number | null {
  return computeWeightedChildRollup(strategicObjectives);
}

/**
 * Peso efectivo para consolidar el proyecto: evita peso 0, negativo o no finito (usa 1).
 * No aplica a rollups de KR/SO/IO — solo al promedio proyecto ← objetivos institucionales.
 */
function normalizeProjectObjectiveWeight(w: unknown): number {
  const n = typeof w === "number" ? w : Number(w);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return n;
}

/**
 * Objetivos institucionales (peso) → progreso del proyecto.
 * Si ningún IO aporta progreso válido, devuelve **0** (no `null`) para poder persistir y mostrar siempre un %.
 */
export function computeProjectProgressFromInstitutionalObjectives(
  institutionalObjectives: WeightedProgressChild[]
): number {
  const normalized = institutionalObjectives.map((c) => ({
    weight: normalizeProjectObjectiveWeight(c.weight),
    progress: c.progress,
  }));
  const r = computeWeightedChildRollup(normalized);
  return r === null ? 0 : r;
}
