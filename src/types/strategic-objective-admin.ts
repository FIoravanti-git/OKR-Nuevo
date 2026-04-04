import type { StrategicObjectiveStatus } from "@/generated/prisma";

export type StrategicObjectiveAdminRow = {
  id: string;
  title: string;
  description: string | null;
  weight: string;
  progressCached: number | null;
  status: StrategicObjectiveStatus;
  sortOrder: number;
  companyId: string;
  companyName: string;
  institutionalObjectiveId: string;
  institutionalObjectiveTitle: string;
  institutionalProjectId: string;
  projectTitle: string;
  keyResultCount: number;
  areaId: string | null;
  areaName: string | null;
  /** Responsables del área (texto para tabla). */
  areaResponsablesLabel: string;
  createdAt: string;
};

export type InstitutionalObjectiveFilterOption = {
  id: string;
  title: string;
  institutionalProjectId: string;
  projectTitle: string;
};
