import "server-only";

import { Prisma } from "@/generated/prisma";
import type {
  KeyResultProgressLogSource,
  KeyResultStatus,
} from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

function numProgress(d: Prisma.Decimal | null | undefined): number | null {
  if (d == null) return null;
  const n = Number(d);
  return Number.isFinite(n) ? n : null;
}

function numMetric(d: Prisma.Decimal | null | undefined): number | null {
  if (d == null) return null;
  const n = Number(d);
  return Number.isFinite(n) ? n : null;
}

function progressChanged(a: number | null, b: number | null): boolean {
  if (a === null && b === null) return false;
  if (a === null || b === null) return true;
  return Math.abs(a - b) >= 0.005;
}

function metricChanged(a: number | null, b: number | null): boolean {
  if (a === null && b === null) return false;
  if (a === null || b === null) return true;
  return Math.abs(a - b) > 1e-6;
}

export type KeyResultProgressSnapshot = {
  progressCached: Prisma.Decimal | null;
  currentValue: Prisma.Decimal | null;
  status: KeyResultStatus;
};

/**
 * Inserta una fila de historial solo si cambió progreso consolidado, valor actual de métrica o estado.
 */
export async function tryAppendKeyResultProgressLog(params: {
  companyId: string;
  keyResultId: string;
  actorId: string | null;
  source: KeyResultProgressLogSource;
  note?: string | null;
  before: KeyResultProgressSnapshot;
  after: KeyResultProgressSnapshot;
}): Promise<void> {
  const bp = numProgress(params.before.progressCached);
  const ap = numProgress(params.after.progressCached);
  const bc = numMetric(params.before.currentValue);
  const ac = numMetric(params.after.currentValue);
  const pCh = progressChanged(bp, ap);
  const cCh = metricChanged(bc, ac);
  const sCh = params.before.status !== params.after.status;
  if (!pCh && !cCh && !sCh) return;

  const noteTrim = params.note?.trim() || null;

  await prisma.keyResultProgressLog.create({
    data: {
      companyId: params.companyId,
      keyResultId: params.keyResultId,
      changedByUserId: params.actorId,
      source: params.source,
      note: noteTrim,
      previousProgress: pCh ? params.before.progressCached : null,
      newProgress: pCh ? params.after.progressCached : null,
      previousCurrentValue: cCh ? params.before.currentValue : null,
      newCurrentValue: cCh ? params.after.currentValue : null,
      previousStatus: sCh ? params.before.status : null,
      newStatus: sCh ? params.after.status : null,
    },
  });
}
