import { z } from "zod";

function trimToUndef(s: string): string | undefined {
  const t = s.trim();
  return t === "" ? undefined : t;
}

const decOpt = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = typeof v === "number" ? v : Number(String(v).trim().replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}, z.number().finite().optional());

export const keyResultFormSchema = z
  .object({
    title: z.string().trim().min(2, "Mínimo 2 caracteres").max(200, "Máximo 200 caracteres"),
    description: z.string().max(8000).transform(trimToUndef),
    metricType: z.enum(["NUMBER", "PERCENT", "CURRENCY", "COUNT", "CUSTOM"]),
    weight: z.coerce
      .number({ message: "Peso numérico requerido" })
      .positive("El peso debe ser mayor a 0")
      .max(1_000_000, "Peso demasiado alto"),
    sortOrder: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? 0 : v),
      z.coerce.number().int().min(0).max(999_999)
    ),
    strategicObjectiveId: z.string().min(1, "Seleccioná un objetivo clave"),
    status: z.enum(["DRAFT", "ON_TRACK", "AT_RISK", "COMPLETED", "CANCELLED"]),
    unit: z.string().max(64).transform(trimToUndef),
    initialValue: decOpt,
    targetValue: decOpt,
    currentValue: decOpt,
    targetDirection: z.enum(["ASCENDENTE", "DESCENDENTE"]).default("ASCENDENTE"),
    calculationMode: z.enum(["MANUAL", "AUTOMATIC", "HYBRID"]),
    progressMode: z.enum([
      "WEIGHTED_AVERAGE",
      "SUM_NORMALIZED",
      "MAX_OF_CHILDREN",
      "MIN_OF_CHILDREN",
      "MANUAL_OVERRIDE",
    ]),
    allowActivityImpact: z.boolean(),
    manualProgress: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.coerce.number().min(0).max(100).optional()
    ),
    /** Solo aplica al editar: se guarda en el historial si hubo cambio de avance/métrica/estado. */
    progressChangeNote: z
      .string()
      .max(2000, "Máximo 2000 caracteres")
      .optional()
      .transform((s) => {
        if (s == null) return undefined;
        const t = s.trim();
        return t === "" ? undefined : t;
      }),
  })
  .superRefine((data, ctx) => {
    if (data.calculationMode === "MANUAL" && data.manualProgress === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "Indicá el progreso entre 0 y 100",
        path: ["manualProgress"],
      });
    }
  });

export const keyResultStatusSchema = z.enum([
  "DRAFT",
  "ON_TRACK",
  "AT_RISK",
  "COMPLETED",
  "CANCELLED",
]);

export const keyResultManualProgressSchema = z
  .object({
    progressInput: z.string(),
    observation: z
      .string()
      .max(2000, "Máximo 2000 caracteres")
      .optional()
      .transform((s) => {
        if (s == null) return undefined;
        const t = s.trim();
        return t === "" ? undefined : t;
      }),
  })
  .superRefine((data, ctx) => {
    const n = Number(data.progressInput.trim().replace(",", "."));
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      ctx.addIssue({
        code: "custom",
        message: "Indicá un porcentaje entre 0 y 100",
        path: ["progressInput"],
      });
    }
  });

export const keyResultMetricCurrentValueQuickSchema = z
  .object({
    currentValueInput: z.string(),
    metricType: z.enum(["NUMBER", "PERCENT", "CURRENCY", "COUNT", "CUSTOM"]),
    observation: z
      .string()
      .max(2000, "Máximo 2000 caracteres")
      .optional()
      .transform((s) => {
        if (s == null) return undefined;
        const t = s.trim();
        return t === "" ? undefined : t;
      }),
  })
  .superRefine((data, ctx) => {
    const n = Number(data.currentValueInput.trim().replace(",", "."));
    if (!Number.isFinite(n)) {
      ctx.addIssue({
        code: "custom",
        message: "Indicá un valor numérico válido",
        path: ["currentValueInput"],
      });
      return;
    }
    if (data.metricType === "COUNT" && !Number.isInteger(n)) {
      ctx.addIssue({
        code: "custom",
        message: "Para tipo Conteo usá un número entero",
        path: ["currentValueInput"],
      });
    }
    if (data.metricType === "PERCENT" && (n < 0 || n > 100)) {
      ctx.addIssue({
        code: "custom",
        message: "Para porcentaje usá un valor entre 0 y 100",
        path: ["currentValueInput"],
      });
    }
  });
