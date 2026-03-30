import { requireRole } from "@/lib/auth/session-user";

export default async function CompaniesLayout({ children }: { children: React.ReactNode }) {
  await requireRole("SUPER_ADMIN");
  return <>{children}</>;
}
