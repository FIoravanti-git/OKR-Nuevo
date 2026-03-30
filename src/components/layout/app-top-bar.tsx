"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { UserRole } from "@/generated/prisma";
import { getCurrentPageLabel } from "@/config/breadcrumbs";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";

type AppTopBarProps = {
  role: UserRole;
};

export function AppTopBar({ role }: AppTopBarProps) {
  const pathname = usePathname();
  const pageLabel = getCurrentPageLabel(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/40",
        "bg-background/85 px-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70",
        "sm:gap-4 sm:px-6"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        <MobileNav role={role} />

        <nav aria-label="Migas de pan" className="flex min-w-0 items-center gap-1.5 text-sm">
          <Link
            href="/dashboard"
            className="hidden shrink-0 text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Inicio
          </Link>
          <ChevronRight className="hidden size-3.5 shrink-0 text-muted-foreground/50 sm:block" aria-hidden />
          <span className="truncate text-[0.9375rem] font-semibold tracking-tight text-foreground">{pageLabel}</span>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <UserMenu />
      </div>
    </header>
  );
}
