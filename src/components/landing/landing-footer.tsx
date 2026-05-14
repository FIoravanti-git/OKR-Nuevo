import Link from "next/link";

const footerLinks = [
  { href: "#beneficios", label: "Beneficios" },
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#producto", label: "Producto" },
  { href: "#planes", label: "Planes" },
  { href: "#diferencial", label: "Diferencial" },
  { href: "#testimonios", label: "Clientes" },
  { href: "#contacto", label: "Contacto" },
];

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-muted/20 py-12 dark:bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="font-heading text-lg font-semibold tracking-tight">OKR Stack</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Plataforma empresarial para gestión estratégica y seguimiento de OKR, con foco en áreas, métricas y ejecución medible.
            </p>
            <div className="mt-4 space-y-1 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Ventas:</span>{" "}
                <a className="text-primary underline-offset-4 hover:underline" href="mailto:ventas@okrstack.com">
                  ventas@okrstack.com
                </a>
              </p>
              <p>
                <span className="font-medium text-foreground">Soporte:</span>{" "}
                <a className="text-primary underline-offset-4 hover:underline" href="mailto:soporte@okrstack.com">
                  soporte@okrstack.com
                </a>
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Navegación</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {footerLinks.map((l) => (
                <li key={l.href}>
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
          <p>© {year} OKR Stack. Todos los derechos reservados.</p>
          <p className="text-[0.6875rem]">Hecho para equipos que ejecutan con criterio, no solo con urgencia.</p>
        </div>
      </div>
    </footer>
  );
}
