import "server-only";

import { Prisma } from "@/generated/prisma";
import { computeProjectProgressFromInstitutionalObjectives } from "@/lib/okr/strategic-progress-engine";
import { prisma } from "@/lib/prisma";

/**
 * Actualiza `progress_cached` del proyecto institucional como **promedio ponderado** de los objetivos
 * institucionales hijos con `includedInGeneralProgress`: Σ (progreso × peso) / Σ peso, solo entre IO con dato de avance.
 */
export async function syncInstitutionalProjectProgressFromObjectives(
  institutionalProjectId: string
): Promise<number | null> {
  const row = await prisma.institutionalProject.findUnique({
    where: { id: institutionalProjectId },
    include: {
      objectives: {
        select: { weight: true, progressCached: true, includedInGeneralProgress: true },
      },
    },
  });

  if (!row) return null;

  const inScope = row.objectives.filter((o) => o.includedInGeneralProgress);

  const computed = computeProjectProgressFromInstitutionalObjectives(
    inScope.map((o) => ({
      weight: Number(o.weight),
      progress: o.progressCached != null ? Number(o.progressCached) : null,
    }))
  );

  const toStore = new Prisma.Decimal(Number(computed.toFixed(2)));

  await prisma.institutionalProject.update({
    where: { id: institutionalProjectId },
    data: { progressCached: toStore },
  });

  return computed;
}
