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

export function LandingPage() {
  return (
    <div className="min-h-svh scroll-smooth bg-background text-foreground">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingBenefits />
        <LandingFeatures />
        <LandingDashboardPreview />
        <LandingPricing />
        <LandingDifferentiator />
        <LandingTestimonials />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
