export type LandingItemStatus = "ACTIVE" | "INACTIVE";

export type LandingNavLink = {
  href: string;
  label: string;
};

export type LandingPreviewBar = {
  label: string;
  width: string;
  tone: string;
};

export type LandingPreviewArea = {
  name: string;
  value: number;
};

export type LandingPreviewKr = {
  title: string;
  status: string;
  dot: string;
};

export type LandingPreviewActivity = {
  title: string;
  date: string;
  progress: string;
};

export type LandingListItem = {
  id: string;
  title: string;
  description: string;
  iconKey: string;
  sortOrder: number;
  status: LandingItemStatus;
};

export type LandingPlanItem = {
  id: string;
  name: string;
  description: string;
  priceLabel: string;
  periodLabel: string | null;
  features: string[];
  isHighlighted: boolean;
  highlightLabel: string | null;
  buttonText: string;
  buttonUrl: string;
  showPrice: boolean;
  sortOrder: number;
  status: LandingItemStatus;
};

export type LandingTestimonialItem = {
  id: string;
  name: string;
  roleCompany: string;
  comment: string;
  avatarUrl: string | null;
  sortOrder: number;
  status: LandingItemStatus;
};

export type LandingFooterLinkItem = {
  id: string;
  label: string;
  href: string;
  sortOrder: number;
  status: LandingItemStatus;
};

export type LandingPageConfig = {
  productName: string;
  hero: {
    title: string;
    subtitle: string;
    primaryButtonText: string;
    primaryButtonUrl: string;
    secondaryButtonText: string;
    secondaryButtonUrl: string;
    showSecondaryButton: boolean;
    footnote: string | null;
    badge1: string | null;
    badge2: string | null;
  };
  nav: {
    logoUrl: string | null;
    brandName: string;
    loginButtonText: string;
    showDemoButton: boolean;
    demoButtonText: string;
    demoButtonUrl: string;
    links: LandingNavLink[];
  };
  benefits: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: LandingListItem[];
  };
  features: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: LandingListItem[];
  };
  preview: {
    eyebrow: string;
    title: string;
    subtitle: string;
    badgeText: string | null;
    progressPercent: string;
    bars: LandingPreviewBar[];
    areas: LandingPreviewArea[];
    krs: LandingPreviewKr[];
    activities: LandingPreviewActivity[];
  };
  differentiator: {
    eyebrow: string;
    title: string;
    subtitle: string;
    points: LandingListItem[];
  };
  pricing: {
    eyebrow: string;
    title: string;
    subtitle: string;
    plans: LandingPlanItem[];
  };
  testimonials: {
    eyebrow: string;
    title: string;
    subtitle: string | null;
    items: LandingTestimonialItem[];
  };
  cta: {
    title: string;
    subtitle: string;
    buttonText: string;
    buttonUrl: string;
    secondaryButtonText: string | null;
    secondaryButtonUrl: string | null;
    footnote: string | null;
  };
  footer: {
    brandText: string;
    description: string;
    contactEmail: string;
    contactWhatsApp: string | null;
    copyrightLine: string | null;
    tagline: string | null;
    links: LandingFooterLinkItem[];
  };
};
