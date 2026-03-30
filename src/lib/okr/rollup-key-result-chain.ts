import "server-only";

import { prisma } from "@/lib/prisma";
import { syncInstitutionalObjectiveProgressFromStrategicChildren } from "@/lib/okr/sync-institutional-objective-progress";
import { syncKeyResultProgress } from "@/lib/okr/sync-key-result-progress";
import { syncStrategicObjectiveProgressFromKeyResults } from "@/lib/okr/sync-strategic-objective-progress";

/**
 * Evita ejecutar dos veces el mismo rollup en paralelo (p. ej. varias mutaciones que llegan
 * seguidas para el mismo KR). Misma promesa = mismo trabajo.
 */
const inflightRollupByKeyResultId = new Map<string, Promise<void>>();

/**
 * Recalcula en cascada **sin duplicar** si ya hay un rollup en curso para el mismo KR:
 *
 * 1. **Resultado clave** — `progress_cached` (actividades, métrica, `valor_actual`, etc.)
 * 2. **Objetivo clave** — agregado desde KRs
 * 3. **Objetivo institucional** — agregado desde objetivos clave
 * 4. **Proyecto institucional** — vía `syncInstitutionalObjectiveProgressFromStrategicChildren` → proyecto
 *
 * Llamar tras cambios en actividades, edición de KR o `currentValue` / métricas.
 */
export async function rollupKeyResultChainFromKeyResultId(keyResultId: string): Promise<void> {
  const existing = inflightRollupByKeyResultId.get(keyResultId);
  if (existing) {
    return existing;
  }

  const run = (async () => {
    await syncKeyResultProgress(keyResultId);
    const row = await prisma.keyResult.findUnique({
      where: { id: keyResultId },
      select: {
        strategicObjectiveId: true,
        strategicObjective: { select: { institutionalObjectiveId: true } },
      },
    });
    if (!row) return;
    await syncStrategicObjectiveProgressFromKeyResults(row.strategicObjectiveId);
    await syncInstitutionalObjectiveProgressFromStrategicChildren(
      row.strategicObjective.institutionalObjectiveId
    );
  })().finally(() => {
    inflightRollupByKeyResultId.delete(keyResultId);
  });

  inflightRollupByKeyResultId.set(keyResultId, run);
  return run;
}

/**
 * Igual que `rollupKeyResultChainFromKeyResultId` pero partiendo de una actividad
 * (útil para jobs o integraciones).
 */
export async function rollupKeyResultChainFromActivityId(activityId: string): Promise<void> {
  const a = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { keyResultId: true },
  });
  if (!a) return;
  await rollupKeyResultChainFromKeyResultId(a.keyResultId);
}
