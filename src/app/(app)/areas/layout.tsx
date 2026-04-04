import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session-user";
import { adminEmpresaMustHaveCompany } from "@/lib/users/policy";

export default async function AreasLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("SUPER_ADMIN", "ADMIN_EMPRESA");

  if (adminEmpresaMustHaveCompany(user)) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
