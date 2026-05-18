import { z } from "zod";

const hexColor = z
  .string()
  .trim()
  .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Usá un color en formato #RGB o #RRGGBB");

const optionalUrl = z.string().trim().max(512).optional().or(z.literal(""));

export const appBrandingFormSchema = z.object({
  appName: z.string().trim().min(1, "El nombre es obligatorio").max(128),
  logoUrl: optionalUrl,
  logoAlt: z.string().trim().max(256).optional().or(z.literal("")),
  faviconUrl: optionalUrl,
  primaryColor: hexColor,
  secondaryColor: hexColor,
});

export type AppBrandingFormInput = z.infer<typeof appBrandingFormSchema>;
