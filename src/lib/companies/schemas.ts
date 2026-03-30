import { z } from "zod";

function trimOrUndef(s: string): string | undefined {
  const t = s.trim();
  return t === "" ? undefined : t;
}

export const companyFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "Máximo 120 caracteres"),
  slug: z
    .string()
    .trim()
    .min(2, "El slug debe tener al menos 2 caracteres")
    .max(64, "Máximo 64 caracteres")
    .transform((s) => s.toLowerCase())
    .refine((s) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s), {
      message: "Solo letras minúsculas, números y guiones (sin espacios)",
    }),
  ruc: z
    .string()
    .max(32, "Máximo 32 caracteres")
    .transform(trimOrUndef),
  email: z
    .string()
    .max(255, "Máximo 255 caracteres")
    .transform(trimOrUndef)
    .refine((s) => s === undefined || z.string().email().safeParse(s).success, {
      message: "Correo no válido",
    }),
  phone: z.string().max(64, "Máximo 64 caracteres").transform(trimOrUndef),
  maxUsers: z.coerce.number().int("Debe ser un entero").min(1, "Mínimo 1 usuario").max(500_000, "Límite muy alto"),
  planId: z.string().transform(trimOrUndef),
  syncMaxFromPlan: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
});

export const companyCreateSchema = companyFormSchema;

export type CompanyFormValues = z.infer<typeof companyFormSchema>;
