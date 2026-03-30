import "server-only";

import { Prisma } from "@/generated/prisma";
import { computeInstitutionalObjectiveProgressFromStrategicObjectives } from "@/lib/okr/strategic-progress-engine";
import { prisma } from "@/lib/prisma";
import { syncInstitutionalProjectProgressFromObjectives } from "@/lib/okr/sync-institutional-project-progress";
import { syncKeyResultProgress } from "@/lib/okr/sync-key-result-progress";
import { syncStrategicObjectiveProgressFromKeyResults } from "@/lib/okr/sync-strategic-objective-progress";

/**
 * Actualiza `progress_cached` del objetivo institucional como **promedio ponderado** de los objetivos clave hijos:
 * Σ (progreso_SO × peso_SO) / Σ peso, solo entre SO con `progress_cached` definido; sin datos válidos → `null`.
 */
export async function syncInstitutionalObjectiveProgressFromStrategicChildren(
  objectiveId: string
): Promise<number | null> {
  const row = await prisma.institutionalObjective.findUnique({
    where: { id: objectiveId },
    include: {
      strategicObjectives: {
        select: { weight: true, progressCached: true },
      },
    },
  });

  if (!row) return null;

  const computed = computeInstitutionalObjectiveProgressFromStrategicObjectives(
    row.strategicObjectives.map((s) => ({
      weight: Number(s.weight),
      progress: s.progressCached != null ? Number(s.progressCached) : null,
    }))
  );

  const toStore =
    computed == null ? null : new Prisma.Decimal(Number(computed.toFixed(2)));

  await prisma.institutionalObjective.update({
    where: { id: objectiveId },
    data: { progressCached: toStore },
  });

  await syncInstitutionalProjectProgressFromObjectives(row.institutionalProjectId);

  return computed;
}

/**
 * Recalcula en cascada: cada KR → su objetivo clave, luego el objetivo institucional.
 * Útil para el botón “Recalcular” cuando se quiere alinear todo antes de consolidar el IO.
 */
export async function syncInstitutionalObjectiveProgressFromStrategicChildrenDeep(
  objectiveId: string
): Promise<number | null> {
  const sos = await prisma.strategicObjective.findMany({
    where: { institutionalObjectiveId: objectiveId },
    select: { id: true },
  });
  for (const so of sos) {
    const krs = await prisma.keyResult.findMany({
      where: { strategicObjectiveId: so.id },
      select: { id: true },
    });
    for (const kr of krs) {
      await syncKeyResultProgress(kr.id);
    }
    await syncStrategicObjectiveProgressFromKeyResults(so.id);
  }
  return syncInstitutionalObjectiveProgressFromStrategicChildren(objectiveId);
}
