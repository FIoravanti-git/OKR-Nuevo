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
  /** Vacío = sin dependencia (fin → inicio). */
  dependsOnActivityId: z
    .string()
    .optional()
    .transform((s) => {
      if (s == null) return undefined;
      const t = s.trim();
      return t === "" ? undefined : t;
    }),
  status: z.enum(["PLANNED", "IN_PROGRESS", "DONE", "BLOCKED", "CANCELLED"]),
  impactsProgress: z.boolean(),
  /** Texto numérico; si la tarea no impacta el KR, puede ir vacío (se guarda 0 en BD). */
  contributionWeight: z.string(),
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
  })
  .superRefine((data, ctx) => {
    if (!data.impactsProgress) return;
    const tw = data.contributionWeight.trim();
    if (tw === "") {
      ctx.addIssue({
        code: "custom",
        message: "Indicá el peso de impacto (mayor a 0).",
        path: ["contributionWeight"],
      });
      return;
    }
    const n = Number(tw.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "El peso debe ser mayor a 0.",
        path: ["contributionWeight"],
      });
      return;
    }
    if (n > 1_000_000) {
      ctx.addIssue({
        code: "custom",
        message: "Peso demasiado alto.",
        path: ["contributionWeight"],
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
