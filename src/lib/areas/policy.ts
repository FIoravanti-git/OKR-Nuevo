import type { SessionUser } from "@/lib/auth/session-user";
import type { Prisma } from "@/generated/prisma";

export function canMutateAreas(user: SessionUser): boolean {
  return user.role === "SUPER_ADMIN" || user.role === "ADMIN_EMPRESA";
}

export function canViewAreas(user: SessionUser): boolean {
  return canMutateAreas(user);
}

/** ADMIN_EMPRESA sin empresa no opera áreas. */
export function adminEmpresaMustHaveCompany(user: SessionUser): boolean {
  return user.role === "ADMIN_EMPRESA" && !user.companyId;
}

export function enforcedCompanyIdForAreaWrite(
  user: SessionUser,
  requestedCompanyId?: string | null
): string | null {
  if (user.role === "ADMIN_EMPRESA") {
    return user.companyId ?? null;
  }
  const t = requestedCompanyId?.trim();
  return t && t !== "" ? t : null;
}

export function areaListWhere(user: SessionUser): Prisma.AreaWhereInput {
  if (user.role === "SUPER_ADMIN") {
    return {};
  }
  if (user.companyId) {
    return { companyId: user.companyId };
  }
  return { id: "__none__" };
}

export function areasForCompanyWhere(companyId: string): Prisma.AreaWhereInput {
  return { companyId, status: "ACTIVE" };
}

export function canViewAreaRecord(user: SessionUser, areaCompanyId: string): boolean {
  if (user.role === "SUPER_ADMIN") return true;
  if (user.role === "ADMIN_EMPRESA" && user.companyId === areaCompanyId) return true;
  return false;
}
