import type { ActivityStatus, InstitutionalProjectStatus } from "@/generated/prisma";

import { parseReportDateFrom, parseReportDateTo } from "@/lib/reports/schemas-dates";

export { parseReportDateFrom, parseReportDateTo } from "@/lib/reports/schemas-dates";

const PROJECT_STATUSES: InstitutionalProjectStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];
const ACTIVITY_STATUSES: ActivityStatus[] = [
  "PLANNED",
  "IN_PROGRESS",
  "DONE",
  "BLOCKED",
  "CANCELLED",
];

function firstString(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export function parseProjectStatus(raw: string | undefined): InstitutionalProjectStatus | null {
  const t = raw?.trim();
  if (!t) return null;
  return PROJECT_STATUSES.includes(t as InstitutionalProjectStatus)
    ? (t as InstitutionalProjectStatus)
    : null;
}

export function parseActivityStatus(raw: string | undefined): ActivityStatus | null {
  const t = raw?.trim();
  if (!t) return null;
  return ACTIVITY_STATUSES.includes(t as ActivityStatus) ? (t as ActivityStatus) : null;
}

/** Normaliza `searchParams` de Next a valores de filtro. */
export function parseReportSearchParams(sp: Record<string, string | string[] | undefined>) {
  const companyId = firstString(sp.companyId)?.trim() || null;
  const projectId = firstString(sp.projectId)?.trim() || null;
  const projectStatus = parseProjectStatus(firstString(sp.projectStatus));
  const activityStatus = parseActivityStatus(firstString(sp.activityStatus));
  const from = parseReportDateFrom(firstString(sp.from)?.trim() ?? null);
  const to = parseReportDateTo(firstString(sp.to)?.trim() ?? null);

  return {
    companyId,
    projectId,
    projectStatus,
    activityStatus,
    from,
    to,
  };
}
