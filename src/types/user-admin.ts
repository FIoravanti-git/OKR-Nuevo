import type { UserRole } from "@/generated/prisma";

export type UserAdminRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string | null;
  companyName: string | null;
  isActive: boolean;
  createdAt: string;
};
