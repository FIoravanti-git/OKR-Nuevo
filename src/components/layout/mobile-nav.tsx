"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, Menu } from "lucide-react";
import type { UserRole } from "@/generated/prisma";
import { filterNavSectionsByRole } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

type MobileNavProps = {
  role: UserRole;
};

export function MobileNav({ role }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const sections = filterNavSectionsByRole(role);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="shrink-0 border-border/80 bg-background/80 shadow-sm lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú de navegación"
      >
        <Menu className="size-4" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-[min(100vw,18rem)] flex-col gap-0 p-0" showCloseButton>
          <SheetHeader className="border-b border-border/60 px-4 py-4 text-left">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-md dark:from-primary/90 dark:to-slate-900">
                <BarChart3 className="size-[1.05rem]" strokeWidth={2.25} />
              </span>
              <div>
                <SheetTitle className="text-left text-sm font-semibold">OKR Stack</SheetTitle>
                <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Navegación</p>
              </div>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1 px-2 py-3">
            <nav className="flex flex-col gap-4" aria-label="Principal">
              {sections.map((section) => (
                <div key={section.id}>
                  <p className="mb-1.5 px-2 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.title}
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    {section.items.map((item) => {
                      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                              active
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-foreground/80 hover:bg-muted"
                            )}
                          >
                            <item.icon className="size-4 shrink-0 opacity-80" strokeWidth={2} />
                            {item.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </ScrollArea>
          <Separator />
          <p className="px-4 py-3 text-center text-[0.65rem] text-muted-foreground">OKR multiempresa</p>
        </SheetContent>
      </Sheet>
    </>
  );
}
