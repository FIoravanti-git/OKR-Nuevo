import { z } from "zod";

const optionalUrl = z.string().trim().max(512).optional().or(z.literal(""));
const requiredUrl = z.string().trim().min(1, "La URL es obligatoria").max(512);
const optionalText = z.string().trim().max(2000).optional().or(z.literal(""));

export const landingHeroSchema = z.object({
  productName: z.string().trim().min(1, "El nombre del producto es obligatorio").max(128),
  heroTitle: z.string().trim().min(1, "El título es obligatorio").max(500),
  heroSubtitle: z.string().trim().min(1, "El subtítulo es obligatorio").max(2000),
  heroPrimaryButtonText: z.string().trim().min(1).max(128),
  heroPrimaryButtonUrl: requiredUrl,
  heroSecondaryButtonText: z.string().trim().max(128).optional().or(z.literal("")),
  heroSecondaryButtonUrl: optionalUrl,
  showSecondaryButton: z.boolean(),
  heroFootnote: optionalText,
  heroBadge1: z.string().trim().max(128).optional().or(z.literal("")),
  heroBadge2: z.string().trim().max(128).optional().or(z.literal("")),
});

export const landingNavSchema = z.object({
  logoUrl: optionalUrl,
  brandName: z.string().trim().min(1).max(128),
  loginButtonText: z.string().trim().min(1).max(64),
  showDemoButton: z.boolean(),
  demoButtonText: z.string().trim().min(1).max(64),
  demoButtonUrl: requiredUrl,
  navLinks: z
    .array(
      z.object({
        href: z.string().trim().min(1).max(512),
        label: z.string().trim().min(1).max(128),
      })
    )
    .min(1, "Agregá al menos un enlace de navegación"),
});

export const landingSectionHeadSchema = z.object({
  eyebrow: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1).max(500),
  subtitle: z.string().trim().min(1).max(2000),
});

export const landingPreviewSchema = z.object({
  previewEyebrow: z.string().trim().min(1).max(64),
  previewTitle: z.string().trim().min(1).max(500),
  previewSubtitle: z.string().trim().min(1).max(2000),
  previewBadgeText: z.string().trim().max(128).optional().or(z.literal("")),
  previewProgressPercent: z.string().trim().min(1).max(16),
  previewBars: z.array(
    z.object({
      label: z.string().trim().min(1),
      width: z.string().trim().min(1),
      tone: z.string().trim().min(1),
    })
  ),
  previewAreas: z.array(
    z.object({
      name: z.string().trim().min(1),
      value: z.coerce.number().min(0).max(100),
    })
  ),
  previewKrs: z.array(
    z.object({
      title: z.string().trim().min(1),
      status: z.string().trim().min(1),
      dot: z.string().trim().min(1),
    })
  ),
  previewActivities: z.array(
    z.object({
      title: z.string().trim().min(1),
      date: z.string().trim().min(1),
      progress: z.string().trim().min(1),
    })
  ),
  differentiatorEyebrow: z.string().trim().min(1).max(64),
  differentiatorTitle: z.string().trim().min(1).max(500),
  differentiatorSubtitle: z.string().trim().min(1).max(2000),
});

export const landingListItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1).max(256),
  description: z.string().trim().min(1).max(2000),
  iconKey: z.string().trim().min(1).max(64),
  sortOrder: z.coerce.number().int().min(0),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const landingPlanSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(128),
  description: z.string().trim().min(1).max(2000),
  priceLabel: z.string().trim().min(1).max(64),
  periodLabel: z.string().trim().max(32).optional().or(z.literal("")),
  features: z.array(z.string().trim().min(1)).min(1, "Agregá al menos una característica"),
  isHighlighted: z.boolean(),
  highlightLabel: z.string().trim().max(64).optional().or(z.literal("")),
  buttonText: z.string().trim().min(1).max(128),
  buttonUrl: requiredUrl,
  showPrice: z.boolean(),
  sortOrder: z.coerce.number().int().min(0),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const landingTestimonialSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(128),
  roleCompany: z.string().trim().min(1).max(256),
  comment: z.string().trim().min(1).max(2000),
  avatarUrl: optionalUrl,
  sortOrder: z.coerce.number().int().min(0),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const landingFooterLinkSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1).max(128),
  href: requiredUrl,
  sortOrder: z.coerce.number().int().min(0),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const landingCtaFooterSchema = z.object({
  ctaTitle: z.string().trim().min(1).max(500),
  ctaSubtitle: z.string().trim().min(1).max(2000),
  ctaButtonText: z.string().trim().min(1).max(128),
  ctaButtonUrl: requiredUrl,
  ctaSecondaryButtonText: z.string().trim().max(128).optional().or(z.literal("")),
  ctaSecondaryButtonUrl: optionalUrl,
  ctaFootnote: optionalText,
  footerBrandText: z.string().trim().min(1).max(128),
  footerDescription: z.string().trim().min(1).max(2000),
  contactEmail: z.string().trim().email("Correo inválido").max(255),
  contactWhatsApp: z.string().trim().max(64).optional().or(z.literal("")),
  copyrightLine: optionalText,
  footerTagline: optionalText,
});

export type LandingHeroInput = z.infer<typeof landingHeroSchema>;
export type LandingNavInput = z.infer<typeof landingNavSchema>;
export type LandingPreviewInput = z.infer<typeof landingPreviewSchema>;
export type LandingListItemInput = z.infer<typeof landingListItemSchema>;
export type LandingPlanInput = z.infer<typeof landingPlanSchema>;
export type LandingTestimonialInput = z.infer<typeof landingTestimonialSchema>;
export type LandingFooterLinkInput = z.infer<typeof landingFooterLinkSchema>;
export type LandingCtaFooterInput = z.infer<typeof landingCtaFooterSchema>;
