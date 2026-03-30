export type CompanyTableRow = {
  id: string;
  name: string;
  slug: string;
  ruc: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  planId: string | null;
  planName: string;
  maxUsers: number;
  userCount: number;
  createdAt: string;
};
