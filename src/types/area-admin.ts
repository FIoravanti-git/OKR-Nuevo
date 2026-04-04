import type { AreaStatus } from "@/generated/prisma";

export type AreaTableRow = {
  id: string;
  name: string;
  description: string | null;
  status: AreaStatus;
  companyId: string;
  companyName: string;
  /** Texto listo para mostrar (varios responsables). */
  responsablesLabel: string;
  memberCount: number;
  createdAt: string;
  /** Puede borrarse del sistema sin vínculos (el servidor vuelve a validar). */
  canDelete: boolean;
};
