import "server-only";

import { Prisma } from "@/generated/prisma";
import { computeProjectProgressFromInstitutionalObjectives } from "@/lib/okr/strategic-progress-engine";
import { prisma } from "@/lib/prisma";

/**
 * Actualiza `progress_cached` del proyecto institucional como **promedio ponderado** de los objetivos
 * institucionales hijos: Σ (progreso_IO × peso_IO) / Σ peso, solo entre IO con `progress_cached` definido.
 */
export async function syncInstitutionalProjectProgressFromObjectives(
  institutionalProjectId: string
): Promise<number | null> {
  const row = await prisma.institutionalProject.findUnique({
    where: { id: institutionalProjectId },
    include: {
      objectives: {
        select: { weight: true, progressCached: true },
      },
    },
  });

  if (!row) return null;

  const computed = computeProjectProgressFromInstitutionalObjectives(
    row.objectives.map((o) => ({
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
