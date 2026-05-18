"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session-user";
import { prisma } from "@/lib/prisma";
import { LANDING_CONFIG_ROW_ID } from "./constants";
import { getDefaultLandingConfigScalars } from "./defaults";
import {
  landingCtaFooterSchema,
  landingHeroSchema,
  landingListItemSchema,
  landingNavSchema,
  landingPlanSchema,
  landingPreviewSchema,
  landingSectionHeadSchema,
  landingTestimonialSchema,
  landingFooterLinkSchema,
  type LandingCtaFooterInput,
  type LandingHeroInput,
  type LandingListItemInput,
  type LandingNavInput,
  type LandingPlanInput,
  type LandingPreviewInput,
  type LandingTestimonialInput,
} from "./schemas";

export type LandingActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

function revalidateLanding() {
  revalidatePath("/");
  revalidatePath("/configuracion");
}

async function ensureLandingConfigRow() {
  const existing = await prisma.landingConfig.findUnique({
    where: { id: LANDING_CONFIG_ROW_ID },
    select: { id: true },
  });
  if (existing) return;

  const scalars = getDefaultLandingConfigScalars();
  await prisma.landingConfig.create({
    data: {
      id: LANDING_CONFIG_ROW_ID,
      ...scalars,
    },
  });
}

function failValidation(error: z.ZodError): LandingActionResult {
  return {
    ok: false,
    message: "Revisá los campos del formulario.",
    fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
  };
}

export async function saveLandingHero(input: unknown): Promise<LandingActionResult> {
  await requireRole("SUPER_ADMIN");
  const parsed = landingHeroSchema.safeParse(input);
  if (!parsed.success) return failValidation(parsed.error);

  await ensureLandingConfigRow();
  const d = parsed.data;

  await prisma.landingConfig.update({
    where: { id: LANDING_CONFIG_ROW_ID },
    data: {
      productName: d.productName,
      heroTitle: d.heroTitle,
      heroSubtitle: d.heroSubtitle,
      heroPrimaryButtonText: d.heroPrimaryButtonText,
      heroPrimaryButtonUrl: d.heroPrimaryButtonUrl,
      heroSecondaryButtonText: d.heroSecondaryButtonText || null,
      heroSecondaryButtonUrl: d.heroSecondaryButtonUrl || null,
      showSecondaryButton: d.showSecondaryButton,
      heroFootnote: d.heroFootnote || null,
      heroBadge1: d.heroBadge1 || null,
      heroBadge2: d.heroBadge2 || null,
    },
  });

  revalidateLanding();
  return { ok: true };
}

export async function saveLandingNav(input: unknown): Promise<LandingActionResult> {
  await requireRole("SUPER_ADMIN");
  const parsed = landingNavSchema.safeParse(input);
  if (!parsed.success) return failValidation(parsed.error);

  await ensureLandingConfigRow();
  const d = parsed.data;

  await prisma.landingConfig.update({
    where: { id: LANDING_CONFIG_ROW_ID },
    data: {
      logoUrl: d.logoUrl || null,
      brandName: d.brandName,
      loginButtonText: d.loginButtonText,
      showDemoButton: d.showDemoButton,
      demoButtonText: d.demoButtonText,
      demoButtonUrl: d.demoButtonUrl,
      navLinksJson: d.navLinks,
    },
  });

  revalidateLanding();
  return { ok: true };
}

export async function saveLandingBenefitsSection(input: unknown): Promise<LandingActionResult> {
  await requireRole("SUPER_ADMIN");
  const body = input as { section?: unknown; items?: unknown };
  const sectionParsed = landingSectionHeadSchema.safeParse(body.section);
  if (!sectionParsed.success) return failValidation(sectionParsed.error);

  const itemsParsed = z.array(landingListItemSchema).safeParse(body.items ?? []);
  if (!itemsParsed.success) return failValidation(itemsParsed.error);

  await ensureLandingConfigRow();
  await syncListItems("benefit", itemsParsed.data, sectionParsed.data, "benefits");
  revalidateLanding();
  return { ok: true };
}

export async function saveLandingFeaturesSection(input: unknown): Promise<LandingActionResult> {
  await requireRole("SUPER_ADMIN");
  const body = input as { section?: unknown; items?: unknown };
  const sectionParsed = landingSectionHeadSchema.safeParse(body.section);
  if (!sectionParsed.success) return failValidation(sectionParsed.error);

  const itemsParsed = z.array(landingListItemSchema).safeParse(body.items ?? []);
  if (!itemsParsed.success) return failValidation(itemsParsed.error);

  await ensureLandingConfigRow();
  await syncListItems("feature", itemsParsed.data, sectionParsed.data, "features");
  revalidateLanding();
  return { ok: true };
}

export async function saveLandingPreviewSection(input: unknown): Promise<LandingActionResult> {
  await requireRole("SUPER_ADMIN");
  const parsed = landingPreviewSchema.safeParse(input);
  if (!parsed.success) return failValidation(parsed.error);

  await ensureLandingConfigRow();
  const d = parsed.data;

  await prisma.landingConfig.update({
    where: { id: LANDING_CONFIG_ROW_ID },
    data: {
      previewEyebrow: d.previewEyebrow,
      previewTitle: d.previewTitle,
      previewSubtitle: d.previewSubtitle,
      previewBadgeText: d.previewBadgeText || null,
      previewProgressPercent: d.previewProgressPercent,
      previewBarsJson: d.previewBars,
      previewAreasJson: d.previewAreas,
      previewKrsJson: d.previewKrs,
      previewActivitiesJson: d.previewActivities,
      differentiatorEyebrow: d.differentiatorEyebrow,
      differentiatorTitle: d.differentiatorTitle,
      differentiatorSubtitle: d.differentiatorSubtitle,
    },
  });

  revalidateLanding();
  return { ok: true };
}

export async function saveLandingDifferentiatorPoints(input: unknown): Promise<LandingActionResult> {
  await requireRole("SUPER_ADMIN");
  const itemsParsed = z.array(landingListItemSchema).safeParse(input);
  if (!itemsParsed.success) return failValidation(itemsParsed.error);

  await ensureLandingConfigRow();
  await syncDifferentiatorPoints(itemsParsed.data);
  revalidateLanding();
  return { ok: true };
}

export async function saveLandingPlansSection(input: unknown): Promise<LandingActionResult> {
  await requireRole("SUPER_ADMIN");
  const body = input as { section?: unknown; plans?: unknown };
  const sectionParsed = landingSectionHeadSchema.safeParse(body.section);
  if (!sectionParsed.success) return failValidation(sectionParsed.error);

  const plansParsed = z.array(landingPlanSchema).safeParse(body.plans ?? []);
  if (!plansParsed.success) return failValidation(plansParsed.error);

  await ensureLandingConfigRow();

  await prisma.landingConfig.update({
    where: { id: LANDING_CONFIG_ROW_ID },
    data: {
      pricingEyebrow: sectionParsed.data.eyebrow,
      pricingTitle: sectionParsed.data.title,
      pricingSubtitle: sectionParsed.data.subtitle,
    },
  });

  const existing = await prisma.landingPlan.findMany({
    where: { configId: LANDING_CONFIG_ROW_ID },
    select: { id: true },
  });
  const keepIds = new Set<string>();

  for (const plan of plansParsed.data) {
    const payload = {
      name: plan.name,
      description: plan.description,
      priceLabel: plan.priceLabel,
      periodLabel: plan.periodLabel || null,
      featuresJson: plan.features,
      isHighlighted: plan.isHighlighted,
      highlightLabel: plan.highlightLabel || null,
      buttonText: plan.buttonText,
      buttonUrl: plan.buttonUrl,
      showPrice: plan.showPrice,
      sortOrder: plan.sortOrder,
      status: plan.status,
    };

    const existingPlan = plan.id ? await prisma.landingPlan.findUnique({ where: { id: plan.id }, select: { id: true } }) : null;
    if (existingPlan) {
      keepIds.add(existingPlan.id);
      await prisma.landingPlan.update({ where: { id: existingPlan.id }, data: payload });
    } else {
      const created = await prisma.landingPlan.create({
        data: { configId: LANDING_CONFIG_ROW_ID, ...payload },
      });
      keepIds.add(created.id);
    }
  }

  const toDelete = existing.filter((e) => !keepIds.has(e.id)).map((e) => e.id);
  if (toDelete.length) {
    await prisma.landingPlan.deleteMany({ where: { id: { in: toDelete } } });
  }

  revalidateLanding();
  return { ok: true };
}

export async function saveLandingTestimonialsSection(input: unknown): Promise<LandingActionResult> {
  await requireRole("SUPER_ADMIN");
  const body = input as { section?: unknown; items?: unknown };
  const sectionParsed = z
    .object({
      eyebrow: z.string().trim().min(1).max(64),
      title: z.string().trim().min(1).max(500),
      subtitle: z.string().trim().max(2000).optional().or(z.literal("")),
    })
    .safeParse(body.section);
  if (!sectionParsed.success) return failValidation(sectionParsed.error);

  const itemsParsed = z.array(landingTestimonialSchema).safeParse(body.items ?? []);
  if (!itemsParsed.success) return failValidation(itemsParsed.error);

  await ensureLandingConfigRow();

  await prisma.landingConfig.update({
    where: { id: LANDING_CONFIG_ROW_ID },
    data: {
      testimonialsEyebrow: sectionParsed.data.eyebrow,
      testimonialsTitle: sectionParsed.data.title,
      testimonialsSubtitle: sectionParsed.data.subtitle || null,
    },
  });

  const existing = await prisma.landingTestimonial.findMany({
    where: { configId: LANDING_CONFIG_ROW_ID },
    select: { id: true },
  });
  const keepIds = new Set<string>();

  for (const item of itemsParsed.data) {
    const payload = {
      name: item.name,
      roleCompany: item.roleCompany,
      comment: item.comment,
      avatarUrl: item.avatarUrl || null,
      sortOrder: item.sortOrder,
      status: item.status,
    };

    const existingT = item.id ? await prisma.landingTestimonial.findUnique({ where: { id: item.id }, select: { id: true } }) : null;
    if (existingT) {
      keepIds.add(existingT.id);
      await prisma.landingTestimonial.update({ where: { id: existingT.id }, data: payload });
    } else {
      const created = await prisma.landingTestimonial.create({
        data: { configId: LANDING_CONFIG_ROW_ID, ...payload },
      });
      keepIds.add(created.id);
    }
  }

  const toDelete = existing.filter((e) => !keepIds.has(e.id)).map((e) => e.id);
  if (toDelete.length) {
    await prisma.landingTestimonial.deleteMany({ where: { id: { in: toDelete } } });
  }

  revalidateLanding();
  return { ok: true };
}

export async function saveLandingCtaFooter(input: unknown): Promise<LandingActionResult> {
  await requireRole("SUPER_ADMIN");
  const body = input as LandingCtaFooterInput & { footerLinks?: unknown };
  const parsed = landingCtaFooterSchema.safeParse(body);
  if (!parsed.success) return failValidation(parsed.error);

  const linksParsed = z.array(landingFooterLinkSchema).safeParse(body.footerLinks ?? []);
  if (!linksParsed.success) return failValidation(linksParsed.error);

  await ensureLandingConfigRow();
  const d = parsed.data;

  await prisma.landingConfig.update({
    where: { id: LANDING_CONFIG_ROW_ID },
    data: {
      ctaTitle: d.ctaTitle,
      ctaSubtitle: d.ctaSubtitle,
      ctaButtonText: d.ctaButtonText,
      ctaButtonUrl: d.ctaButtonUrl,
      ctaSecondaryButtonText: d.ctaSecondaryButtonText || null,
      ctaSecondaryButtonUrl: d.ctaSecondaryButtonUrl || null,
      ctaFootnote: d.ctaFootnote || null,
      footerBrandText: d.footerBrandText,
      footerDescription: d.footerDescription,
      contactEmail: d.contactEmail,
      contactWhatsApp: d.contactWhatsApp || null,
      copyrightLine: d.copyrightLine || null,
      footerTagline: d.footerTagline || null,
    },
  });

  const existing = await prisma.landingFooterLink.findMany({
    where: { configId: LANDING_CONFIG_ROW_ID },
    select: { id: true },
  });
  const keepIds = new Set<string>();

  for (const link of linksParsed.data) {
    const payload = {
      label: link.label,
      href: link.href,
      sortOrder: link.sortOrder,
      status: link.status,
    };

    const existingLink = link.id ? await prisma.landingFooterLink.findUnique({ where: { id: link.id }, select: { id: true } }) : null;
    if (existingLink) {
      keepIds.add(existingLink.id);
      await prisma.landingFooterLink.update({ where: { id: existingLink.id }, data: payload });
    } else {
      const created = await prisma.landingFooterLink.create({
        data: { configId: LANDING_CONFIG_ROW_ID, ...payload },
      });
      keepIds.add(created.id);
    }
  }

  const toDelete = existing.filter((e) => !keepIds.has(e.id)).map((e) => e.id);
  if (toDelete.length) {
    await prisma.landingFooterLink.deleteMany({ where: { id: { in: toDelete } } });
  }

  revalidateLanding();
  return { ok: true };
}

type SectionHead = { eyebrow: string; title: string; subtitle: string };

async function syncListItems(
  kind: "benefit" | "feature",
  items: LandingListItemInput[],
  section: SectionHead,
  sectionKey: "benefits" | "features"
) {
  const sectionData =
    sectionKey === "benefits"
      ? {
          benefitsEyebrow: section.eyebrow,
          benefitsTitle: section.title,
          benefitsSubtitle: section.subtitle,
        }
      : {
          featuresEyebrow: section.eyebrow,
          featuresTitle: section.title,
          featuresSubtitle: section.subtitle,
        };

  await prisma.landingConfig.update({
    where: { id: LANDING_CONFIG_ROW_ID },
    data: sectionData,
  });

  if (kind === "benefit") {
    await syncBenefitItems(items);
  } else {
    await syncFeatureItems(items);
  }
}

async function syncBenefitItems(items: LandingListItemInput[]) {
  const existing = await prisma.landingBenefit.findMany({
    where: { configId: LANDING_CONFIG_ROW_ID },
    select: { id: true },
  });
  const keepIds = new Set<string>();

  for (const item of items) {
    const payload = {
      title: item.title,
      description: item.description,
      iconKey: item.iconKey,
      sortOrder: item.sortOrder,
      status: item.status,
    };

    const existingRow = item.id ? await prisma.landingBenefit.findUnique({ where: { id: item.id }, select: { id: true } }) : null;

    if (existingRow) {
      keepIds.add(existingRow.id);
      await prisma.landingBenefit.update({ where: { id: existingRow.id }, data: payload });
    } else {
      const created = await prisma.landingBenefit.create({
        data: { configId: LANDING_CONFIG_ROW_ID, ...payload },
      });
      keepIds.add(created.id);
    }
  }

  const toDelete = existing.filter((e) => !keepIds.has(e.id)).map((e) => e.id);
  if (toDelete.length) {
    await prisma.landingBenefit.deleteMany({ where: { id: { in: toDelete } } });
  }
}

async function syncFeatureItems(items: LandingListItemInput[]) {
  const existing = await prisma.landingFeature.findMany({
    where: { configId: LANDING_CONFIG_ROW_ID },
    select: { id: true },
  });
  const keepIds = new Set<string>();

  for (const item of items) {
    const payload = {
      title: item.title,
      description: item.description,
      iconKey: item.iconKey,
      sortOrder: item.sortOrder,
      status: item.status,
    };

    const existingRow = item.id ? await prisma.landingFeature.findUnique({ where: { id: item.id }, select: { id: true } }) : null;

    if (existingRow) {
      keepIds.add(existingRow.id);
      await prisma.landingFeature.update({ where: { id: existingRow.id }, data: payload });
    } else {
      const created = await prisma.landingFeature.create({
        data: { configId: LANDING_CONFIG_ROW_ID, ...payload },
      });
      keepIds.add(created.id);
    }
  }

  const toDelete = existing.filter((e) => !keepIds.has(e.id)).map((e) => e.id);
  if (toDelete.length) {
    await prisma.landingFeature.deleteMany({ where: { id: { in: toDelete } } });
  }
}

async function syncDifferentiatorPoints(items: LandingListItemInput[]) {
  const existing = await prisma.landingDifferentiatorPoint.findMany({
    where: { configId: LANDING_CONFIG_ROW_ID },
    select: { id: true },
  });
  const keepIds = new Set<string>();

  for (const item of items) {
    const payload = {
      title: item.title,
      description: item.description,
      iconKey: item.iconKey,
      sortOrder: item.sortOrder,
      status: item.status,
    };

    const existingRow = item.id
      ? await prisma.landingDifferentiatorPoint.findUnique({ where: { id: item.id }, select: { id: true } })
      : null;

    if (existingRow) {
      keepIds.add(existingRow.id);
      await prisma.landingDifferentiatorPoint.update({ where: { id: existingRow.id }, data: payload });
    } else {
      const created = await prisma.landingDifferentiatorPoint.create({
        data: { configId: LANDING_CONFIG_ROW_ID, ...payload },
      });
      keepIds.add(created.id);
    }
  }

  const toDelete = existing.filter((e) => !keepIds.has(e.id)).map((e) => e.id);
  if (toDelete.length) {
    await prisma.landingDifferentiatorPoint.deleteMany({ where: { id: { in: toDelete } } });
  }
}
