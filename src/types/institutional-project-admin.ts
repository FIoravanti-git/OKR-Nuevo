import type { InstitutionalProjectStatus } from "@/generated/prisma";

export type InstitutionalProjectAdminRow = {
  id: string;
  title: string;
  description: string | null;
  year: number | null;
  methodology: string | null;
  status: InstitutionalProjectStatus;
  companyId: string;
  companyName: string;
  objectivesCount: number;
  createdAt: string;
  createdAtLabel: string;
};
