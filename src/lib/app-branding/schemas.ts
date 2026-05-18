import { z } from "zod";

const hexColorOptional = z
  .string()
  .max(32)
  .optional()
  .default("")
  .refine((s) => s === "" || /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(s.trim()), {
    message: "Usá un color en formato #RGB o #RRGGBB",
  });

export const appBrandingFormSchema = z.object({
  appName: z.string().max(128).optional().default(""),
  logoUrl: z.string().max(512).optional().default(""),
  logoAlt: z.string().max(256).optional().default(""),
  faviconUrl: z.string().max(512).optional().default(""),
  primaryColor: hexColorOptional,
  secondaryColor: hexColorOptional,
});

export type AppBrandingFormInput = z.input<typeof appBrandingFormSchema>;
