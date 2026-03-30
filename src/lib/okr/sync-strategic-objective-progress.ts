import "server-only";

import { Prisma } from "@/generated/prisma";
import { computeStrategicObjectiveProgressFromKeyResults } from "@/lib/okr/strategic-progress-engine";
import { prisma } from "@/lib/prisma";

/**
 * Actualiza `progress_cached` del objetivo clave como **promedio ponderado** de los resultados clave hijos:
 * Σ (progreso_KR × peso_KR) / Σ peso, solo entre KRs con `progress_cached` definido; sin datos válidos → `null`.
 */
export async function syncStrategicObjectiveProgressFromKeyResults(
  strategicObjectiveId: string
): Promise<number | null> {
  const row = await prisma.strategicObjective.findUnique({
    where: { id: strategicObjectiveId },
    include: {
      keyResults: {
        select: { weight: true, progressCached: true },
      },
    },
  });

  if (!row) return null;

  const computed = computeStrategicObjectiveProgressFromKeyResults(
    row.keyResults.map((k) => ({
      weight: Number(k.weight),
      progress: k.progressCached != null ? Number(k.progressCached) : null,
    }))
  );

  const toStore =
    computed == null ? null : new Prisma.Decimal(Number(computed.toFixed(2)));

  await prisma.strategicObjective.update({
    where: { id: strategicObjectiveId },
    data: { progressCached: toStore },
  });

  return computed;
}
