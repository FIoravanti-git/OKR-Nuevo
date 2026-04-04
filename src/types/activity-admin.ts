import type { ActivityStatus, ProgressCalculationMode } from "@/generated/prisma";

export type ActivityDependencyOption = {
  id: string;
  title: string;
  status: ActivityStatus;
  keyResultTitle: string;
};

export type KeyResultOptionForActivity = {
  id: string;
  title: string;
  companyId: string;
  projectTitle: string;
  institutionalObjectiveTitle: string;
  strategicObjectiveTitle: string;
  /** Área del resultado clave, si tiene. */
  keyResultAreaId: string | null;
  /** Área del objetivo clave padre, si tiene. */
  strategicObjectiveAreaId: string | null;
  allowActivityImpact: boolean;
  progressMode: ProgressCalculationMode;
  /**
   * Suma de pesos de impacto de otras actividades del mismo KR con “impacta el indicador”.
   * En edición, excluye la actividad actual (para advertencia de suma ≈ 100).
   */
  otherImpactingWeightsSum: number;
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
  actualStartDate: string | null;
  dependsOnActivityId: string | null;
  dependsOnTitle: string | null;
  dependsOnStatus: ActivityStatus | null;
  dependencySatisfied: boolean;
  blockedByDependency: boolean;
  plannedStartAtRisk: boolean;
  delayedStartVsPlanned: boolean;
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
  /** Áreas en las que el usuario es miembro (puede haber varias). */
  membershipAreaIds: string[];
};
