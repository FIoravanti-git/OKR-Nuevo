import "server-only";

import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import {
  computeKeyResultProgress,
  type ActivityRollupInput,
} from "@/lib/okr/strategic-progress-engine";

/**
 * Persiste `progress_cached` del KR según el motor en `strategic-progress-engine`.
 * En modo MANUAL no escribe (el % lo define el usuario).
 */
export async function syncKeyResultProgress(keyResultId: string): Promise<number | null> {
  const row = await prisma.keyResult.findUnique({
    where: { id: keyResultId },
    include: {
      activities: {
        select: {
          impactsProgress: true,
          contributionWeight: true,
          progressContribution: true,
        },
      },
    },
  });

  if (!row) return null;

  if (row.calculationMode === "MANUAL") {
    return row.progressCached != null ? Number(row.progressCached) : null;
  }

  const activities: ActivityRollupInput[] = row.activities.map((a) => ({
    impactsProgress: a.impactsProgress,
    contributionWeight: Number(a.contributionWeight),
    progressContribution: a.progressContribution != null ? Number(a.progressContribution) : null,
  }));

  const computed = computeKeyResultProgress({
    calculationMode: row.calculationMode,
    storedProgressPercent: row.progressCached != null ? Number(row.progressCached) : null,
    initialValue: row.initialValue != null ? Number(row.initialValue) : null,
    currentValue: row.currentValue != null ? Number(row.currentValue) : null,
    targetValue: row.targetValue != null ? Number(row.targetValue) : null,
    targetDirection: row.targetDirection,
    allowActivityImpact: row.allowActivityImpact,
    progressMode: row.progressMode,
    activities,
  });

  const toStore =
    computed == null ? null : new Prisma.Decimal(Number(computed.toFixed(2)));

  await prisma.keyResult.update({
    where: { id: keyResultId },
    data: { progressCached: toStore },
  });

  return computed;
}
