import { z } from "zod";

function trimToUndef(s: string): string | undefined {
  const t = s.trim();
  return t === "" ? undefined : t;
}

export const institutionalObjectiveFormSchema = z.object({
  title: z.string().trim().min(2, "Mínimo 2 caracteres").max(200, "Máximo 200 caracteres"),
  description: z.string().max(8000).transform(trimToUndef),
  weight: z.coerce
    .number({ message: "Peso numérico requerido" })
    .positive("El peso debe ser mayor a 0")
    .max(1_000_000, "Peso demasiado alto"),
  sortOrder: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? 0 : v),
    z.coerce.number().int().min(0).max(999_999)
  ),
  institutionalProjectId: z.string().min(1, "Seleccioná un proyecto institucional"),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"]),
});

export const institutionalObjectiveStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);
