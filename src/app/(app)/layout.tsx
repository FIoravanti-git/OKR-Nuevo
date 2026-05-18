import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { getAppBranding } from "@/lib/app-branding/data";

/** Evita SSG en build: estas rutas usan auth/Prisma y no deben pre-renderizarse sin BD. */
export const dynamic = "force-dynamic";

export default async function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const branding = await getAppBranding();

  return (
    <AuthenticatedShell role={session.user.role} branding={branding}>
      {children}
    </AuthenticatedShell>
  );
}
