import { z } from "zod";

function trimOrUndef(s: string): string | undefined {
  const t = s.trim();
  return t === "" ? undefined : t;
}

/** Campos que el administrador de empresa puede editar en su tenant (sin plan ni cupos). */
export const tenantCompanySettingsSchema = z.object({
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
  ruc: z.string().max(32, "Máximo 32 caracteres").transform(trimOrUndef),
  email: z
    .string()
    .max(255, "Máximo 255 caracteres")
    .transform(trimOrUndef)
    .refine((s) => s === undefined || z.string().email().safeParse(s).success, {
      message: "Correo no válido",
    }),
  phone: z.string().max(64, "Máximo 64 caracteres").transform(trimOrUndef),
});

export type TenantCompanySettingsInput = z.input<typeof tenantCompanySettingsSchema>;
export type TenantCompanySettingsValues = z.infer<typeof tenantCompanySettingsSchema>;
