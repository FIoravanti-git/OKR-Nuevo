import type { ActivityStatus, Prisma } from "@/generated/prisma";

/** Inicio del día actual en UTC (alineado con `formatDate` del proyecto). */
export function getUtcStartOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Vencida: tiene fecha de vencimiento anterior al día de hoy (calendario UTC) y no está Hecha.
 */
export function isActivityOverdue(
  dueDate: Date | string | null | undefined,
  status: ActivityStatus
): boolean {
  if (status === "DONE") return false;
  if (dueDate == null) return false;
  const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  if (Number.isNaN(d.getTime())) return false;
  const dueDay = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return dueDay < getUtcStartOfToday().getTime();
}

/** Condición Prisma reutilizable (misma regla que `isActivityOverdue`). */
export function prismaActivityOverdueWhere(companyId?: string | null): Prisma.ActivityWhereInput {
  const w: Prisma.ActivityWhereInput = {
    dueDate: { lt: getUtcStartOfToday() },
    status: { not: "DONE" },
  };
  if (companyId) {
    return { ...w, companyId };
  }
  return w;
}
