/**
 * Punto de entrada para **recalcular avances** en la jerarquía OKR (server-only).
 *
 * - `rollupKeyResultChainFromKeyResultId`: cascada completa (KR → OC → OI → proyecto) y **deduplica** rollups
 *   concurrentes para el mismo KR.
 * - `rollupKeyResultChainFromActivityId`: mismo efecto partiendo de una actividad.
 * - Las funciones `sync*` actualizan un solo nivel; el motor puro está en `strategic-progress-engine`.
 */

export {
  rollupKeyResultChainFromActivityId,
  rollupKeyResultChainFromKeyResultId,
} from "@/lib/okr/rollup-key-result-chain";
export { syncInstitutionalObjectiveProgressFromStrategicChildren } from "@/lib/okr/sync-institutional-objective-progress";
export { syncInstitutionalProjectProgressFromObjectives } from "@/lib/okr/sync-institutional-project-progress";
export { syncKeyResultProgress } from "@/lib/okr/sync-key-result-progress";
export { syncStrategicObjectiveProgressFromKeyResults } from "@/lib/okr/sync-strategic-objective-progress";
