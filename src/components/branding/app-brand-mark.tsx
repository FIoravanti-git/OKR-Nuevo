import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppBrandingConfig } from "@/lib/app-branding/types";

type Variant = "sidebar" | "login" | "landing" | "footer";

type Props = {
  branding: AppBrandingConfig;
  variant?: Variant;
  className?: string;
  subtitle?: string | null;
};

export function AppBrandMark({ branding, variant = "sidebar", className, subtitle }: Props) {
  const name = branding.appName.trim() || "OKR Stack";
  const alt = branding.logoAlt?.trim() || name;
  const parts = name.split(/\s+/);
  const short = parts[0] ?? name;
  const rest = parts.slice(1).join(" ");

  const isLogin = variant === "login";
  const isLanding = variant === "landing";

  const iconBox = cn(
    "flex shrink-0 items-center justify-center overflow-hidden rounded-xl",
    isLogin &&
      "size-[3.25rem] bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900 text-white shadow-lg shadow-black/40 ring-1 ring-white/15",
    variant === "sidebar" &&
      "size-9 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white shadow-md ring-1 ring-white/10 dark:from-primary/90 dark:via-primary dark:to-slate-900",
    (isLanding || variant === "footer") && "size-8 rounded-lg"
  );

  return (
    <div className={cn("flex min-w-0 items-center gap-2.5 sm:gap-3", className)}>
      <span className={iconBox}>
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt={alt} className="size-full object-contain p-0.5" />
        ) : isLanding || variant === "footer" ? (
          <span className="rounded-lg bg-primary/15 px-2 py-0.5 text-sm font-semibold text-primary">{short}</span>
        ) : (
          <BarChart3 className={cn(isLogin ? "size-[1.35rem]" : "size-[1.05rem]")} strokeWidth={2.25} />
        )}
      </span>
      <div className={cn("min-w-0", isLogin && "text-left")}>
        <p
          className={cn(
            "truncate font-semibold tracking-tight",
            isLogin && "text-[0.9375rem] text-white",
            variant === "sidebar" && "text-sm text-sidebar-foreground",
            (isLanding || variant === "footer") && "font-heading text-base text-foreground sm:text-lg"
          )}
        >
          {branding.logoUrl || !rest ? (
            name
          ) : (
            <>
              <span className={isLanding ? "text-primary" : undefined}>{short}</span>{" "}
              <span className={isLogin ? "text-white" : "text-foreground"}>{rest}</span>
            </>
          )}
        </p>
        {subtitle ? (
          <p
            className={cn(
              "truncate text-[0.65rem] font-semibold uppercase tracking-[0.14em]",
              isLogin ? "text-zinc-500" : "text-muted-foreground"
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
