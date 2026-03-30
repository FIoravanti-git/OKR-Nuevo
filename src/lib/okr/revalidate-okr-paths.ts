import "server-only";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Invalida rutas que muestran avance consolidado (KR → objetivo clave → institucional → proyecto).
 */
export async function revalidateOkrHierarchyPaths(params: {
  institutionalObjectiveId: string;
  strategicObjectiveId?: string;
  keyResultId?: string;
}): Promise<void> {
  const { institutionalObjectiveId, strategicObjectiveId, keyResultId } = params;

  revalidatePath("/resultados-clave");
  if (keyResultId) {
    revalidatePath(`/resultados-clave/${keyResultId}`);
    revalidatePath(`/resultados-clave/${keyResultId}/edit`);
  }
  revalidatePath("/objetivos-clave");
  if (strategicObjectiveId) {
    revalidatePath(`/objetivos-clave/${strategicObjectiveId}`);
    revalidatePath(`/objetivos-clave/${strategicObjectiveId}/edit`);
  }
  revalidatePath("/objetivos");
  revalidatePath(`/objetivos/${institutionalObjectiveId}`);
  revalidatePath("/actividades");
  revalidatePath("/dashboard");
  revalidatePath("/reportes");

  const io = await prisma.institutionalObjective.findUnique({
    where: { id: institutionalObjectiveId },
    select: { institutionalProjectId: true },
  });
  if (io) {
    revalidatePath("/proyecto");
    revalidatePath(`/proyecto/${io.institutionalProjectId}`);
  }
}

/** Tras mutar un objetivo institucional o su avance consolidado. */
export async function revalidateInstitutionalObjectiveScope(
  institutionalObjectiveId: string,
  institutionalProjectId: string
): Promise<void> {
  revalidatePath("/objetivos");
  revalidatePath(`/objetivos/${institutionalObjectiveId}`);
  revalidatePath(`/objetivos/${institutionalObjectiveId}/edit`);
  revalidatePath("/proyecto");
  revalidatePath(`/proyecto/${institutionalProjectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/reportes");
}
