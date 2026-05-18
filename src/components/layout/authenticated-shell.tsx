"use client";

import type { UserRole } from "@/generated/prisma";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopBar } from "@/components/layout/app-top-bar";
import type { AppBrandingConfig } from "@/lib/app-branding/types";

type AuthenticatedShellProps = {
  role: UserRole;
  branding: AppBrandingConfig;
  children: React.ReactNode;
};

export function AuthenticatedShell({ role, branding, children }: AuthenticatedShellProps) {
  return (
    <div className="flex min-h-svh w-full bg-muted/40 dark:bg-background">
      <AppSidebar role={role} branding={branding} />
      <div className="flex min-h-svh min-w-0 flex-1 flex-col bg-background shadow-[inset_1px_0_0_0_oklch(0_0_0/0.04)] dark:shadow-[inset_1px_0_0_0_oklch(1_0_0/0.06)]">
        <AppTopBar role={role} branding={branding} />
        <main className="relative flex-1 overflow-auto">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_50%_-30%,oklch(0.52_0.06_262/0.06),transparent)] dark:bg-[radial-gradient(ellipse_90%_50%_at_50%_-28%,oklch(0.55_0.1_262/0.12),transparent)]"
          />
          <div className="relative min-h-[calc(100vh-3.5rem)]">{children}</div>
        </main>
      </div>
    </div>
  );
}
