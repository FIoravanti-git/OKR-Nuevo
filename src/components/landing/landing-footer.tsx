import Link from "next/link";
import { AppBrandMark } from "@/components/branding/app-brand-mark";
import type { AppBrandingConfig } from "@/lib/app-branding/types";
import type { LandingPageConfig } from "@/lib/landing-config/types";

type Props = {
  config: LandingPageConfig["footer"];
  branding: AppBrandingConfig;
};

export function LandingFooter({ config, branding }: Props) {
  const year = new Date().getFullYear();
  const copyright =
    config.copyrightLine?.replace("{year}", String(year)) ??
    `© ${year} ${branding.appName}. Todos los derechos reservados.`;

  const whatsappHref = config.contactWhatsApp
    ? config.contactWhatsApp.startsWith("http")
      ? config.contactWhatsApp
      : `https://wa.me/${config.contactWhatsApp.replace(/\D/g, "")}`
    : null;

  return (
    <footer className="border-t border-border/60 bg-muted/20 py-12 dark:bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <AppBrandMark branding={branding} variant="footer" />
            {config.brandText !== branding.appName ? (
              <p className="mt-2 text-sm text-muted-foreground">{config.brandText}</p>
            ) : null}
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{config.description}</p>
            <div className="mt-4 space-y-1 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Contacto:</span>{" "}
                <a className="text-primary underline-offset-4 hover:underline" href={`mailto:${config.contactEmail}`}>
                  {config.contactEmail}
                </a>
              </p>
              {whatsappHref ? (
                <p>
                  <span className="font-medium text-foreground">WhatsApp:</span>{" "}
                  <a className="text-primary underline-offset-4 hover:underline" href={whatsappHref} target="_blank" rel="noreferrer">
                    Escribinos
                  </a>
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Navegación</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {config.links.map((l) => (
                <li key={l.id}>
                  <a className="transition-colors hover:text-foreground" href={l.href}>
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <Link className="transition-colors hover:text-foreground" href="/login">
                  Iniciar sesión
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Legal</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <span className="cursor-not-allowed opacity-70">Términos (próximamente)</span>
              </li>
              <li>
                <span className="cursor-not-allowed opacity-70">Privacidad (próximamente)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>{copyright}</p>
          {config.tagline ? <p className="text-[0.6875rem]">{config.tagline}</p> : null}
        </div>
      </div>
    </footer>
  );
}
