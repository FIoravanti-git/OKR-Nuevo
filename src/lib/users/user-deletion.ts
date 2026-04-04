import { prisma } from "@/lib/prisma";

/**
 * Usuario eliminable solo sin vínculos operativos ni trazas que deban conservarse.
 * Incluye: tareas asignadas, pertenencia a áreas, historiales de avance y auditoría como actor.
 */
export async function isUserDeletable(userId: string): Promise<boolean> {
  const [assignedActivities, areaLinks, actProgressLogs, krProgressLogs, auditLogs] = await Promise.all([
    prisma.activity.count({ where: { assigneeUserId: userId } }),
    prisma.areaMember.count({ where: { userId } }),
    prisma.activityProgressLog.count({ where: { changedByUserId: userId } }),
    prisma.keyResultProgressLog.count({ where: { changedByUserId: userId } }),
    prisma.auditLog.count({ where: { actorUserId: userId } }),
  ]);
  return (
    assignedActivities === 0 &&
    areaLinks === 0 &&
    actProgressLogs === 0 &&
    krProgressLogs === 0 &&
    auditLogs === 0
  );
}

export async function getUsersDeletableMap(userIds: string[]): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>();
  if (userIds.length === 0) return map;

  const [
    byAssignee,
    byMember,
    byActLog,
    byKrLog,
    byAudit,
  ] = await Promise.all([
    prisma.activity.groupBy({
      by: ["assigneeUserId"],
      where: { assigneeUserId: { in: userIds } },
      _count: { _all: true },
    }),
    prisma.areaMember.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _count: { _all: true },
    }),
    prisma.activityProgressLog.groupBy({
      by: ["changedByUserId"],
      where: { changedByUserId: { in: userIds } },
      _count: { _all: true },
    }),
    prisma.keyResultProgressLog.groupBy({
      by: ["changedByUserId"],
      where: { changedByUserId: { in: userIds } },
      _count: { _all: true },
    }),
    prisma.auditLog.groupBy({
      by: ["actorUserId"],
      where: { actorUserId: { in: userIds } },
      _count: { _all: true },
    }),
  ]);

  const blocked = new Set<string>();
  for (const row of byAssignee) {
    if (row.assigneeUserId) blocked.add(row.assigneeUserId);
  }
  for (const row of byMember) blocked.add(row.userId);
  for (const row of byActLog) {
    if (row.changedByUserId) blocked.add(row.changedByUserId);
  }
  for (const row of byKrLog) {
    if (row.changedByUserId) blocked.add(row.changedByUserId);
  }
  for (const row of byAudit) {
    if (row.actorUserId) blocked.add(row.actorUserId);
  }

  for (const id of userIds) {
    map.set(id, !blocked.has(id));
  }
  return map;
}
