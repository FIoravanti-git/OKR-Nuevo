import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LandingThemeToggle } from "@/components/landing/landing-theme-toggle";
import { AppBrandMark } from "@/components/branding/app-brand-mark";
import type { AppBrandingConfig } from "@/lib/app-branding/types";
import type { LandingPageConfig } from "@/lib/landing-config/types";

type Props = {
  config: LandingPageConfig;
  branding: AppBrandingConfig;
};

export function LandingNav({ config, branding }: Props) {
  const { nav } = config;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/" className="min-w-0">
            <AppBrandMark branding={branding} variant="landing" />
          </Link>
          <Badge variant="secondary" className="hidden shrink-0 text-[0.625rem] font-semibold uppercase tracking-wider sm:inline-flex">
            PWA
          </Badge>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.links.map((l) => (
            <a
              key={`${l.href}-${l.label}`}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LandingThemeToggle />
          <Button variant="ghost" size="sm" className="inline-flex" nativeButton={false} render={<Link href="/login" />}>
            {nav.loginButtonText}
          </Button>
          {nav.showDemoButton ? (
            <Button size="sm" className="shadow-sm" nativeButton={false} render={<Link href={nav.demoButtonUrl} />}>
              {nav.demoButtonText}
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
