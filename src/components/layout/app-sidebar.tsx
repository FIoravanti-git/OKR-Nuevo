"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { BarChart3, LogOut } from "lucide-react";
import type { UserRole } from "@/generated/prisma";
import { filterNavSectionsByRole } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type AppSidebarProps = {
  role: UserRole;
};

export function AppSidebar({ role }: AppSidebarProps) {
  const pathname = usePathname();
  const sections = filterNavSectionsByRole(role);

  return (
    <aside className="hidden h-svh w-[4.75rem] shrink-0 flex-col border-r border-border/50 bg-gradient-to-b from-sidebar via-sidebar to-sidebar/98 shadow-[1px_0_0_0_oklch(0_0_0/0.04)] dark:shadow-[1px_0_0_0_oklch(1_0_0/0.06)] lg:flex lg:w-[17.5rem]">
      <div className="flex h-14 items-center justify-center border-b border-border/40 px-2 lg:justify-start lg:gap-3 lg:px-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white shadow-md shadow-slate-900/25 ring-1 ring-white/10 dark:from-primary/90 dark:via-primary dark:to-slate-900 dark:shadow-primary/20">
          <BarChart3 className="size-[1.05rem]" strokeWidth={2.25} />
        </span>
        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">OKR Stack</p>
          <p className="truncate text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Enterprise
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-2 py-4 lg:px-3">
        <nav className="flex flex-col gap-6" aria-label="Aplicación">
          {sections.map((section) => (
            <div key={section.id}>
              <p className="mb-2.5 hidden px-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground lg:block">
                {section.title}
              </p>
              <ul className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={item.title}
                        className={cn(
                          "group flex items-center justify-center gap-3 rounded-lg py-2.5 transition-colors duration-200 lg:justify-start lg:px-3",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-border/50"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "size-[1.125rem] shrink-0 transition-colors",
                            active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          )}
                          strokeWidth={2}
                        />
                        <span className="hidden text-[0.8125rem] font-semibold lg:inline">{item.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="mt-auto border-t border-border/50 p-2 lg:p-3">
        <Separator className="mb-2 hidden lg:block" />
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-full justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive lg:justify-start"
          type="button"
          onClick={() => void signOut({ callbackUrl: "/login" })}
          title="Cerrar sesión"
        >
          <LogOut className="size-4 lg:mr-2" />
          <span className="hidden lg:inline">Cerrar sesión</span>
        </Button>
      </div>
    </aside>
  );
}
