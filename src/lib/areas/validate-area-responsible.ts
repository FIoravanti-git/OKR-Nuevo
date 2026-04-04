import { prisma } from "@/lib/prisma";

/** Resultado al comprobar si el usuario puede dejar de pertenecer a ciertas áreas (p. ej. al cambiar área desde Usuarios). */
export async function validateUserCanLeaveAreas(
  userId: string,
  areaIdsToLeave: string[]
): Promise<{ ok: true } | { ok: false; areaName: string }> {
  for (const aid of areaIdsToLeave) {
    const userRow = await prisma.areaMember.findUnique({
      where: { areaId_userId: { areaId: aid, userId } },
      select: { esResponsable: true },
    });
    if (!userRow) continue;

    const responsableCount = await prisma.areaMember.count({
      where: { areaId: aid, esResponsable: true },
    });

    if (userRow.esResponsable && responsableCount === 1) {
      const area = await prisma.area.findUnique({
        where: { id: aid },
        select: { name: true },
      });
      return {
        ok: false,
        areaName: area?.name ?? "área",
      };
    }
  }
  return { ok: true };
}

export function messageCannotLeaveAsSoleResponsable(areaName: string): string {
  return `No se puede cambiar el área de este usuario porque es el único responsable del área «${areaName}». Asigná primero otro responsable desde el módulo Áreas.`;
}
