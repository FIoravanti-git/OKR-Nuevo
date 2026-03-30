import type { UserRole } from "@/generated/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      companyId: string | null;
      companyName: string | null;
    };
  }

  interface User {
    role: UserRole;
    companyId: string | null;
    companyName: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    email?: string | null;
    name?: string | null;
    role?: UserRole;
    companyId?: string | null;
    companyName?: string | null;
  }
}
