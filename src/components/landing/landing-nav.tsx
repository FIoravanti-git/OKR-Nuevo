import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LandingThemeToggle } from "@/components/landing/landing-theme-toggle";

const links = [
  { href: "#beneficios", label: "Beneficios" },
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#producto", label: "Producto" },
  { href: "#planes", label: "Planes" },
  { href: "#testimonios", label: "Clientes" },
];

export function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-heading text-base font-semibold tracking-tight sm:text-lg">
          <span className="rounded-lg bg-primary/15 px-2 py-0.5 text-primary">OKR</span>
          <span className="text-foreground">Stack</span>
          <Badge variant="secondary" className="hidden text-[0.625rem] font-semibold uppercase tracking-wider sm:inline-flex">
            PWA
          </Badge>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
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
            Iniciar sesión
          </Button>
          <Button size="sm" className="shadow-sm" nativeButton={false} render={<Link href="#contacto" />}>
            Solicitar demo
          </Button>
        </div>
      </div>
    </header>
  );
}
