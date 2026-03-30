"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { assignCompanyPlan } from "@/lib/companies/actions";
import type { PlanOption } from "@/components/companies/company-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type CompanyAssignPlanProps = {
  companyId: string;
  plans: PlanOption[];
  currentPlanId: string | null;
};

export function CompanyAssignPlan({ companyId, plans, currentPlanId }: CompanyAssignPlanProps) {
  const router = useRouter();
  const [planId, setPlanId] = useState(currentPlanId ?? "");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPlanId(currentPlanId ?? "");
  }, [currentPlanId]);

  async function handleAssign() {
    if (!planId) {
      toast.error("Elegí un plan.");
      return;
    }
    setPending(true);
    try {
      const r = await assignCompanyPlan(companyId, planId);
      if (r.ok) {
        toast.success("Plan asociado y cupo actualizado según el catálogo.");
        router.refresh();
      } else {
        toast.error(r.message);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor="quick-plan">Cambiar plan (suscripción activa)</Label>
        <select
          id="quick-plan"
          className="flex h-8 w-full max-w-md rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
        >
          <option value="" disabled>
            Seleccionar…
          </option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Cierra la suscripción activa anterior y crea una nueva en estado activo. El cupo de usuarios se iguala al del
          plan.
        </p>
      </div>
      <Button type="button" disabled={pending || !planId} onClick={() => void handleAssign()}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Aplicar plan
      </Button>
    </div>
  );
}
