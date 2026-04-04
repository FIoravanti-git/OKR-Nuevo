import { prisma } from "@/lib/prisma";

/** Comprueba que el área exista y pertenezca a la empresa (cualquier estado; permite mantener referencias históricas). */
export async function isAreaInCompany(areaId: string, companyId: string): Promise<boolean> {
  const a = await prisma.area.findFirst({
    where: { id: areaId, companyId },
    select: { id: true },
  });
  return !!a;
}
