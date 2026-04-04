import { prisma } from "@/lib/prisma";

/** Actividades cuyo resultado clave (o su objetivo clave) apunta a esta área. */
export async function countActivitiesLinkedToArea(areaId: string): Promise<number> {
  return prisma.activity.count({
    where: {
      keyResult: {
        OR: [{ areaId }, { strategicObjective: { areaId } }],
      },
    },
  });
}

export async function isAreaDeletable(areaId: string): Promise<boolean> {
  const [members, strategicObjectives, keyResults, activities] = await Promise.all([
    prisma.areaMember.count({ where: { areaId } }),
    prisma.strategicObjective.count({ where: { areaId } }),
    prisma.keyResult.count({ where: { areaId } }),
    countActivitiesLinkedToArea(areaId),
  ]);
  return members === 0 && strategicObjectives === 0 && keyResults === 0 && activities === 0;
}

export async function getAreasDeletableMap(areaIds: string[]): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>();
  if (areaIds.length === 0) return map;
  const flags = await Promise.all(areaIds.map(async (id) => [id, await isAreaDeletable(id)] as const));
  for (const [id, ok] of flags) map.set(id, ok);
  return map;
}
