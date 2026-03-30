import type { ActivityStatus } from "@/generated/prisma";

export type KeyResultOptionForActivity = {
  id: string;
  title: string;
  companyId: string;
  projectTitle: string;
  institutionalObjectiveTitle: string;
  strategicObjectiveTitle: string;
};

export type ActivityAdminRow = {
  id: string;
  title: string;
  description: string | null;
  status: ActivityStatus;
  impactsProgress: boolean;
  contributionWeight: string;
  progressContribution: number | null;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  companyId: string;
  companyName: string;
  keyResultId: string;
  keyResultTitle: string;
  strategicObjectiveTitle: string;
  institutionalObjectiveTitle: string;
  projectTitle: string;
  assigneeUserId: string | null;
  assigneeName: string | null;
  assigneeEmail: string | null;
};

export type AssignableUserOption = {
  id: string;
  name: string;
  email: string;
  companyId: string | null;
};
