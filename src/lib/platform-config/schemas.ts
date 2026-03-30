import { z } from "zod";

function trimOrNull(s: string): string | null {
  const t = s.trim();
  return t === "" ? null : t;
}

export const platformConfigFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(128, "Máximo 128 caracteres"),
  supportEmail: z
    .string()
    .max(255)
    .transform((s) => trimOrNull(s))
    .refine((s) => s === null || z.string().email().safeParse(s).success, {
      message: "Correo de soporte no válido",
    }),
  noticeBanner: z
    .string()
    .max(5000, "Máximo 5000 caracteres")
    .transform((s) => trimOrNull(s)),
});

export type PlatformConfigFormInput = z.input<typeof platformConfigFormSchema>;
export type PlatformConfigFormValues = z.infer<typeof platformConfigFormSchema>;
