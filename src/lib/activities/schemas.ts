import { z } from "zod";

function trimToUndef(s: string): string | undefined {
  const t = s.trim();
  return t === "" ? undefined : t;
}

export const activityFormSchema = z.object({
  title: z.string().trim().min(2, "Mínimo 2 caracteres").max(200, "Máximo 200 caracteres"),
  description: z.string().max(8000).transform(trimToUndef),
  keyResultId: z.string().min(1, "Seleccioná un resultado clave"),
  assigneeUserId: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().min(1).optional()
  ),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "DONE", "BLOCKED", "CANCELLED"]),
  impactsProgress: z.boolean(),
  contributionWeight: z.coerce
    .number({ message: "Peso numérico requerido" })
    .positive("El peso debe ser mayor a 0")
    .max(1_000_000, "Peso demasiado alto"),
  /** Vacío = sin porcentaje (`null` en BD). */
  progressContributionStr: z.string(),
  /** Observación opcional en el historial si cambia avance o estado. */
  observation: z
    .string()
    .max(2000, "Máximo 2000 caracteres")
    .optional()
    .transform((s) => (s == null ? undefined : trimToUndef(s))),
})
  .superRefine((data, ctx) => {
    const t = data.progressContributionStr.trim();
    if (t === "") return;
    const n = Number(t.replace(",", "."));
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      ctx.addIssue({
        code: "custom",
        message: "Avance entre 0 y 100, o vacío",
        path: ["progressContributionStr"],
      });
    }
  });

export const activityStatusSchema = z.enum([
  "PLANNED",
  "IN_PROGRESS",
  "DONE",
  "BLOCKED",
  "CANCELLED",
]);

/** Formulario de seguimiento: avance en texto; vacío = sin porcentaje persistido (`null`). */
export const activityProgressFormSchema = z
  .object({
    status: z.enum(["PLANNED", "IN_PROGRESS", "DONE", "BLOCKED", "CANCELLED"]),
    progressInput: z.string(),
    observation: z
      .string()
      .max(2000, "Máximo 2000 caracteres")
      .optional()
      .transform((s) => (s == null ? undefined : trimToUndef(s))),
  })
  .superRefine((data, ctx) => {
    const t = data.progressInput.trim();
    if (t !== "") {
      const n = Number(t.replace(",", "."));
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        ctx.addIssue({
          code: "custom",
          message: "Indicá un porcentaje entre 0 y 100, o dejá vacío",
          path: ["progressInput"],
        });
      }
    }
  });
