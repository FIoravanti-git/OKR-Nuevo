import type { InstitutionalObjectiveStatus } from "@/generated/prisma";

export type InstitutionalObjectiveAdminRow = {
  id: string;
  title: string;
  description: string | null;
  weight: string;
  /** Si false, no suma al avance general del proyecto. */
  includedInGeneralProgress: boolean;
  progressCached: number | null;
  status: InstitutionalObjectiveStatus;
  sortOrder: number;
  institutionalProjectId: string;
  projectTitle: string;
  companyId: string;
  companyName: string;
  strategicCount: number;
  createdAt: string;
};
