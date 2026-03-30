"use client";

import { ChevronsUpDown } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { roleLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function UserMenu() {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-lg border border-border/50 bg-background/50 px-2.5 font-medium outline-none shadow-sm shadow-black/[0.02] dark:border-border/40 dark:bg-transparent dark:shadow-none",
          "hover:bg-muted/80 hover:text-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/15 text-xs font-medium text-primary">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-[140px] flex-col items-start text-left text-sm leading-tight lg:flex">
          <span className="truncate font-medium">{user.name}</span>
          <span className="truncate text-xs text-muted-foreground">{roleLabel(user.role)}</span>
        </span>
        <ChevronsUpDown className="size-4 text-muted-foreground opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{user.name}</span>
              <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="text-muted-foreground">
          {user.companyName ? `Empresa: ${user.companyName}` : "Alcance global"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void signOut({ callbackUrl: "/login" })}>
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
