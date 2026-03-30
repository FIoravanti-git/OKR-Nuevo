import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";

export default async function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <AuthenticatedShell role={session.user.role}>{children}</AuthenticatedShell>;
}
