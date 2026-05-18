import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LandingThemeToggle } from "@/components/landing/landing-theme-toggle";
import type { LandingPageConfig } from "@/lib/landing-config/types";

type Props = {
  config: LandingPageConfig;
};

export function LandingNav({ config }: Props) {
  const { nav, productName } = config;
  const brandParts = nav.brandName.trim().split(/\s+/);
  const brandShort = brandParts[0] ?? productName;
  const brandRest = brandParts.slice(1).join(" ");

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-heading text-base font-semibold tracking-tight sm:text-lg">
          {nav.logoUrl ? (
            <img src={nav.logoUrl} alt={nav.brandName} className="size-8 rounded-lg object-contain" />
          ) : (
            <>
              <span className="rounded-lg bg-primary/15 px-2 py-0.5 text-primary">{brandShort}</span>
              {brandRest ? <span className="text-foreground">{brandRest}</span> : null}
            </>
          )}
          <Badge variant="secondary" className="hidden text-[0.625rem] font-semibold uppercase tracking-wider sm:inline-flex">
            PWA
          </Badge>
        </Link>

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
