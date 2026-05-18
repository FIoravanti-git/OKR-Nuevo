import { z } from "zod";

/** Entrada del formulario: todos los campos son strings opcionales (vacío = no cambiar en servidor). */
export const platformConfigFormSchema = z.object({
  displayName: z.string().max(128).optional().default(""),
  supportEmail: z.string().max(255).optional().default(""),
  noticeBanner: z.string().max(5000).optional().default(""),
});

export type PlatformConfigFormInput = z.input<typeof platformConfigFormSchema>;
