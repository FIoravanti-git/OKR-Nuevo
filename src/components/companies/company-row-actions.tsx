"use client";

import { Eye, MoreHorizontal, Pencil, Power } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { toggleCompanyActive } from "@/lib/companies/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CompanyRowActionsProps = {
  companyId: string;
  isActive: boolean;
};

export function CompanyRowActions({ companyId, isActive }: CompanyRowActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const r = await toggleCompanyActive(companyId);
      if (r.ok) {
        toast.success(isActive ? "Empresa desactivada" : "Empresa activada");
        router.refresh();
      } else {
        toast.error(r.message);
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-8 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Acciones de empresa"
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => router.push(`/companies/${companyId}`)}>
          <Eye className="size-4" />
          Ver detalle
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/companies/${companyId}/edit`)}>
          <Pencil className="size-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleToggle}
          disabled={pending}
          variant={isActive ? "destructive" : "default"}
        >
          <Power className="size-4" />
          {isActive ? "Desactivar" : "Activar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
