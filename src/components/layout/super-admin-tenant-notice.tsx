import { Building2 } from "lucide-react";

/** Aviso cuando SUPER_ADMIN navega módulos de tenant sin `company_id` en sesión. */
export function SuperAdminTenantNotice() {
  return (
    <div className="mb-8 flex gap-3 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3.5 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
      <Building2 className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
      <p className="leading-relaxed">
        <span className="font-semibold">Vista de plataforma.</span> Para ver datos reales de una empresa, abrí{" "}
        <strong>Empresas</strong> o usá un usuario con empresa asignada. Estos módulos mostrarán placeholders hasta
        que exista contexto de tenant.
      </p>
    </div>
  );
}
