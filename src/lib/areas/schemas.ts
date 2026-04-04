import { z } from "zod";

function trimToUndef(s: string): string | undefined {
  const t = s.trim();
  return t === "" ? undefined : t;
}

const areaBaseFields = {
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200, "Máximo 200 caracteres"),
  description: z.preprocess(
    (v) => (v === undefined || v === null ? "" : v),
    z.string().max(8000, "Máximo 8000 caracteres").transform(trimToUndef)
  ),
  status: z.enum(["ACTIVE", "INACTIVE"]),
};

/** Alta: exige al menos un responsable inicial (se gestionan más desde el detalle del área). */
export const areaCreateSchema = z.object({
  ...areaBaseFields,
  managerUserId: z
    .string()
    .trim()
    .min(1, "Elegí al menos una persona como responsable inicial."),
  /** Solo SUPER_ADMIN al crear; se valida en la acción. */
  companyId: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().min(1).optional()
  ),
});

/** Edición: nombre, descripción y estado; los responsables se administran aparte. */
export const areaUpdateSchema = z.object({
  ...areaBaseFields,
  /** Oculto en formulario cuando ya hay empresa fijada (solo compatibilidad con el form). */
  companyId: z.string().optional(),
});

export type AreaCreateValues = z.infer<typeof areaCreateSchema>;
export type AreaUpdateValues = z.infer<typeof areaUpdateSchema>;
