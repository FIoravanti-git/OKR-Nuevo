import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

type Db = Prisma.TransactionClient | typeof prisma;

export async function countResponsablesInArea(tx: Db, areaId: string): Promise<number> {
  return tx.areaMember.count({
    where: { areaId, esResponsable: true },
  });
}

export async function userIsMemberOfArea(tx: Db, userId: string, areaId: string): Promise<boolean> {
  const row = await tx.areaMember.findUnique({
    where: { areaId_userId: { areaId, userId } },
    select: { id: true },
  });
  return !!row;
}

export async function userBelongsToArea(userId: string, areaId: string): Promise<boolean> {
  return userIsMemberOfArea(prisma, userId, areaId);
}

