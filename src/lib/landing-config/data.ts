import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { LANDING_CONFIG_ROW_ID } from "./constants";
import { getDefaultLandingPageConfig } from "./defaults";
import type {
  LandingFooterLinkItem,
  LandingListItem,
  LandingNavLink,
  LandingPageConfig,
  LandingPlanItem,
  LandingPreviewActivity,
  LandingPreviewArea,
  LandingPreviewBar,
  LandingPreviewKr,
  LandingTestimonialItem,
} from "./types";

const landingInclude = {
  benefits: { orderBy: { sortOrder: "asc" as const } },
  features: { orderBy: { sortOrder: "asc" as const } },
  plans: { orderBy: { sortOrder: "asc" as const } },
  testimonials: { orderBy: { sortOrder: "asc" as const } },
  differentiatorPoints: { orderBy: { sortOrder: "asc" as const } },
  footerLinks: { orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.LandingConfigInclude;

type LandingConfigRow = Prisma.LandingConfigGetPayload<{ include: typeof landingInclude }>;

function parseJsonArray<T>(value: unknown, fallback: T[]): T[] {
  if (!Array.isArray(value)) return fallback;
  return value as T[];
}

function mapListItem(
  row: { id: string; title: string; description: string; iconKey: string; sortOrder: number; status: string }
): LandingListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    iconKey: row.iconKey,
    sortOrder: row.sortOrder,
    status: row.status as LandingListItem["status"],
  };
}

function mapRowToConfig(row: LandingConfigRow, defaults: LandingPageConfig, activeOnly: boolean): LandingPageConfig {
  const filterActive = <T extends { status: string }>(items: T[]) =>
    activeOnly ? items.filter((i) => i.status === "ACTIVE") : items;

  const navLinks = parseJsonArray<LandingNavLink>(row.navLinksJson, defaults.nav.links);

  const benefitsDb = filterActive(row.benefits).map(mapListItem);
  const featuresDb = filterActive(row.features).map(mapListItem);
  const diffDb = filterActive(row.differentiatorPoints).map(mapListItem);

  const plansDb: LandingPlanItem[] = filterActive(row.plans).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    priceLabel: p.priceLabel,
    periodLabel: p.periodLabel,
    features: parseJsonArray<string>(p.featuresJson, []),
    isHighlighted: p.isHighlighted,
    highlightLabel: p.highlightLabel,
    buttonText: p.buttonText,
    buttonUrl: p.buttonUrl,
    showPrice: p.showPrice,
    sortOrder: p.sortOrder,
    status: p.status as LandingPlanItem["status"],
  }));

  const testimonialsDb: LandingTestimonialItem[] = filterActive(row.testimonials).map((t) => ({
    id: t.id,
    name: t.name,
    roleCompany: t.roleCompany,
    comment: t.comment,
    avatarUrl: t.avatarUrl,
    sortOrder: t.sortOrder,
    status: t.status as LandingTestimonialItem["status"],
  }));

  const footerLinksDb: LandingFooterLinkItem[] = filterActive(row.footerLinks).map((l) => ({
    id: l.id,
    label: l.label,
    href: l.href,
    sortOrder: l.sortOrder,
    status: l.status as LandingFooterLinkItem["status"],
  }));

  return {
    productName: row.productName,
    hero: {
      title: row.heroTitle,
      subtitle: row.heroSubtitle,
      primaryButtonText: row.heroPrimaryButtonText,
      primaryButtonUrl: row.heroPrimaryButtonUrl,
      secondaryButtonText: row.heroSecondaryButtonText ?? defaults.hero.secondaryButtonText,
      secondaryButtonUrl: row.heroSecondaryButtonUrl ?? defaults.hero.secondaryButtonUrl,
      showSecondaryButton: row.showSecondaryButton,
      footnote: row.heroFootnote,
      badge1: row.heroBadge1,
      badge2: row.heroBadge2,
    },
    nav: {
      logoUrl: row.logoUrl,
      brandName: row.brandName,
      loginButtonText: row.loginButtonText,
      showDemoButton: row.showDemoButton,
      demoButtonText: row.demoButtonText,
      demoButtonUrl: row.demoButtonUrl,
      links: navLinks,
    },
    benefits: {
      eyebrow: row.benefitsEyebrow,
      title: row.benefitsTitle,
      subtitle: row.benefitsSubtitle,
      items: benefitsDb.length ? benefitsDb : activeOnly ? [] : defaults.benefits.items,
    },
    features: {
      eyebrow: row.featuresEyebrow,
      title: row.featuresTitle,
      subtitle: row.featuresSubtitle,
      items: featuresDb.length ? featuresDb : activeOnly ? [] : defaults.features.items,
    },
    preview: {
      eyebrow: row.previewEyebrow,
      title: row.previewTitle,
      subtitle: row.previewSubtitle,
      badgeText: row.previewBadgeText,
      progressPercent: row.previewProgressPercent,
      bars: parseJsonArray<LandingPreviewBar>(row.previewBarsJson, defaults.preview.bars),
      areas: parseJsonArray<LandingPreviewArea>(row.previewAreasJson, defaults.preview.areas),
      krs: parseJsonArray<LandingPreviewKr>(row.previewKrsJson, defaults.preview.krs),
      activities: parseJsonArray<LandingPreviewActivity>(
        row.previewActivitiesJson,
        defaults.preview.activities
      ),
    },
    differentiator: {
      eyebrow: row.differentiatorEyebrow,
      title: row.differentiatorTitle,
      subtitle: row.differentiatorSubtitle,
      points: diffDb.length ? diffDb : activeOnly ? [] : defaults.differentiator.points,
    },
    pricing: {
      eyebrow: row.pricingEyebrow,
      title: row.pricingTitle,
      subtitle: row.pricingSubtitle,
      plans: plansDb.length ? plansDb : activeOnly ? [] : defaults.pricing.plans,
    },
    testimonials: {
      eyebrow: row.testimonialsEyebrow,
      title: row.testimonialsTitle,
      subtitle: row.testimonialsSubtitle,
      items: testimonialsDb.length ? testimonialsDb : activeOnly ? [] : defaults.testimonials.items,
    },
    cta: {
      title: row.ctaTitle,
      subtitle: row.ctaSubtitle,
      buttonText: row.ctaButtonText,
      buttonUrl: row.ctaButtonUrl,
      secondaryButtonText: row.ctaSecondaryButtonText,
      secondaryButtonUrl: row.ctaSecondaryButtonUrl,
      footnote: row.ctaFootnote,
    },
    footer: {
      brandText: row.footerBrandText,
      description: row.footerDescription,
      contactEmail: row.contactEmail,
      contactWhatsApp: row.contactWhatsApp,
      copyrightLine: row.copyrightLine,
      tagline: row.footerTagline,
      links: footerLinksDb.length ? footerLinksDb : activeOnly ? [] : defaults.footer.links,
    },
  };
}

/** Configuración pública de la landing (solo ítems activos; defaults si no hay fila). */
export async function getLandingPageConfig(): Promise<LandingPageConfig> {
  const defaults = getDefaultLandingPageConfig();

  try {
    const row = await prisma.landingConfig.findUnique({
      where: { id: LANDING_CONFIG_ROW_ID },
      include: landingInclude,
    });

    if (!row) return defaults;

    const mapped = mapRowToConfig(row, defaults, true);

    return {
      ...mapped,
      benefits: {
        ...mapped.benefits,
        items: mapped.benefits.items.length ? mapped.benefits.items : defaults.benefits.items,
      },
      features: {
        ...mapped.features,
        items: mapped.features.items.length ? mapped.features.items : defaults.features.items,
      },
      differentiator: {
        ...mapped.differentiator,
        points: mapped.differentiator.points.length
          ? mapped.differentiator.points
          : defaults.differentiator.points,
      },
      pricing: {
        ...mapped.pricing,
        plans: mapped.pricing.plans.length ? mapped.pricing.plans : defaults.pricing.plans,
      },
      testimonials: {
        ...mapped.testimonials,
        items: mapped.testimonials.items.length ? mapped.testimonials.items : defaults.testimonials.items,
      },
      footer: {
        ...mapped.footer,
        links: mapped.footer.links.length ? mapped.footer.links : defaults.footer.links,
      },
    };
  } catch {
    return defaults;
  }
}

/** Configuración completa para el panel de administración. */
export async function getLandingAdminConfig(): Promise<{
  hasPersistedRow: boolean;
  config: LandingPageConfig;
}> {
  const defaults = getDefaultLandingPageConfig();

  const row = await prisma.landingConfig.findUnique({
    where: { id: LANDING_CONFIG_ROW_ID },
    include: landingInclude,
  });

  if (!row) {
    return { hasPersistedRow: false, config: defaults };
  }

  return {
    hasPersistedRow: true,
    config: mapRowToConfig(row, defaults, false),
  };
}
