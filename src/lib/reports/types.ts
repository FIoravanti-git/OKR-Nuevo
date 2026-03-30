import type {
  ActivityStatus,
  InstitutionalProjectStatus,
} from "@/generated/prisma";

export type ReportFilters = {
  companyId: string | null;
  projectId: string | null;
  projectStatus: InstitutionalProjectStatus | null;
  activityStatus: ActivityStatus | null;
  dateFrom: Date | null;
  dateTo: Date | null;
};

export type ProjectProgressRow = {
  id: string;
  title: string;
  status: string;
  year: number | null;
  companyName: string;
  avgProgress: number | null;
  objectivesCount: number;
};

export type IoProgressRow = {
  id: string;
  title: string;
  status: string;
  progress: number | null;
  weight: string;
  projectTitle: string;
  companyName: string;
};

export type SoProgressRow = {
  id: string;
  title: string;
  status: string;
  progress: number | null;
  weight: string;
  ioTitle: string;
  projectTitle: string;
  companyName: string;
};

export type KrProgressRow = {
  id: string;
  title: string;
  status: string;
  progress: number | null;
  weight: string;
  soTitle: string;
  ioTitle: string;
  projectTitle: string;
  companyName: string;
};

export type ActivityStatusCount = {
  status: ActivityStatus;
  count: number;
};

export type AssigneeActivityRow = {
  userId: string;
  name: string;
  email: string;
  count: number;
};

export type ExecutiveSummary = {
  projectsCount: number;
  institutionalObjectivesCount: number;
  strategicObjectivesCount: number;
  keyResultsCount: number;
  activitiesInScope: number;
  activitiesDoneInScope: number;
  /** Vencidas: vencimiento &lt; hoy y estado ≠ Hecha, dentro del mismo alcance que las actividades del reporte. */
  activitiesOverdueInScope: number;
  avgKeyResultProgress: number | null;
  avgInstitutionalObjectiveProgress: number | null;
};

export type ProgressEvolutionPoint = {
  /** Clave ordenable (mes `yyyy-mm` o inicio de semana `yyyy-mm-dd`). */
  key: string;
  label: string;
  avgProgress: number;
};

export type ExecutiveReportPayload = {
  filters: ReportFilters;
  summary: ExecutiveSummary;
  projectProgress: ProjectProgressRow[];
  ioProgress: IoProgressRow[];
  soProgress: SoProgressRow[];
  krProgress: KrProgressRow[];
  keyResultsShown: number;
  activitiesByStatus: ActivityStatusCount[];
  topAssignees: AssigneeActivityRow[];
  projectIdsInScope: string[];
  emptyReason: string | null;
  /** Serie temporal: promedio de `newProgress` en logs de KR por período (mismo alcance que KRs del reporte). */
  progressEvolution: ProgressEvolutionPoint[];
  progressEvolutionGranularity: "week" | "month";
  /** Texto aclaratorio (p. ej. ventana por defecto de 12 meses si no hay filtro de fechas). */
  progressEvolutionHint: string | null;
};
