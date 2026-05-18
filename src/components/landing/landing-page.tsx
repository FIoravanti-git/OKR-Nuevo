import { LandingNav } from "@/components/landing/landing-nav";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingBenefits } from "@/components/landing/landing-benefits";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingDashboardPreview } from "@/components/landing/landing-dashboard-preview";
import { LandingPricing } from "@/components/landing/landing-pricing";
import { LandingDifferentiator } from "@/components/landing/landing-differentiator";
import { LandingTestimonials } from "@/components/landing/landing-testimonials";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFooter } from "@/components/landing/landing-footer";
import type { AppBrandingConfig } from "@/lib/app-branding/types";
import type { LandingPageConfig } from "@/lib/landing-config/types";

type Props = {
  config: LandingPageConfig;
  branding: AppBrandingConfig;
};

export function LandingPage({ config, branding }: Props) {
  return (
    <div className="min-h-svh scroll-smooth bg-background text-foreground">
      <LandingNav config={config} branding={branding} />
      <main>
        <LandingHero config={config} />
        <LandingBenefits config={config.benefits} />
        <LandingFeatures config={config.features} />
        <LandingDashboardPreview config={config.preview} />
        <LandingPricing config={config.pricing} />
        <LandingDifferentiator config={config.differentiator} />
        <LandingTestimonials config={config.testimonials} />
        <LandingCta config={config.cta} />
      </main>
      <LandingFooter config={config.footer} branding={branding} />
    </div>
  );
}
