import type {
  KeyResultCalculationMode,
  KeyResultMetricType,
  KeyResultStatus,
  KeyResultTargetDirection,
  ProgressCalculationMode,
} from "@/generated/prisma";

export type KeyResultAdminRow = {
  id: string;
  title: string;
  description: string | null;
  metricType: KeyResultMetricType;
  weight: string;
  initialValue: number | null;
  targetValue: number | null;
  currentValue: number | null;
  targetDirection: KeyResultTargetDirection;
  unit: string | null;
  progressCached: number | null;
  status: KeyResultStatus;
  calculationMode: KeyResultCalculationMode;
  progressMode: ProgressCalculationMode;
  allowActivityImpact: boolean;
  sortOrder: number;
  companyId: string;
  companyName: string;
  strategicObjectiveId: string;
  strategicObjectiveTitle: string;
  institutionalObjectiveId: string;
  institutionalObjectiveTitle: string;
  institutionalProjectId: string;
  projectTitle: string;
  activityCount: number;
  areaId: string | null;
  areaName: string | null;
  areaResponsablesLabel: string;
  createdAt: string;
};

export type StrategicObjectiveFilterOption = {
  id: string;
  title: string;
  institutionalObjectiveId: string;
  institutionalObjectiveTitle: string;
  institutionalProjectId: string;
  projectTitle: string;
};

export type InstitutionalObjectiveFilterOption = {
  id: string;
  title: string;
  institutionalProjectId: string;
  projectTitle: string;
};
