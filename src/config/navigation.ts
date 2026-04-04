import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  Crosshair,
  Gauge,
  Landmark,
  LayoutDashboard,
  Layers,
  ListTodo,
  Settings,
  Target,
  Users,
} from "lucide-react";
import type { UserRole } from "@/generated/prisma";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Si está definido, solo esos roles ven el ítem */
  roles?: UserRole[];
};

export type NavSection = {
  id: string;
  title: string;
  items: NavItem[];
};

/**
 * Menú por secciones. Orden y roles alineados con producto OKR multiempresa.
 * - Sin `roles`: visible para todos los autenticados.
 */
export const navSections: NavSection[] = [
  {
    id: "principal",
    title: "Principal",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: "administracion",
    title: "Administración",
    items: [
      {
        title: "Empresas",
        href: "/companies",
        icon: Building2,
        roles: ["SUPER_ADMIN"],
      },
      {
        title: "Usuarios",
        href: "/usuarios",
        icon: Users,
        roles: ["SUPER_ADMIN", "ADMIN_EMPRESA"],
      },
      {
        title: "Áreas",
        href: "/areas",
        icon: Layers,
        roles: ["SUPER_ADMIN", "ADMIN_EMPRESA"],
      },
    ],
  },
  {
    id: "estrategia",
    title: "Estrategia OKR",
    items: [
      {
        title: "Proyecto institucional",
        href: "/proyecto",
        icon: Landmark,
        roles: ["SUPER_ADMIN", "ADMIN_EMPRESA", "OPERADOR"],
      },
      {
        title: "Objetivos institucionales",
        href: "/objetivos",
        icon: Target,
        roles: ["SUPER_ADMIN", "ADMIN_EMPRESA", "OPERADOR"],
      },
      {
        title: "Objetivos clave",
        href: "/objetivos-clave",
        icon: Crosshair,
        roles: ["SUPER_ADMIN", "ADMIN_EMPRESA", "OPERADOR"],
      },
      {
        title: "Resultados clave",
        href: "/resultados-clave",
        icon: Gauge,
        roles: ["SUPER_ADMIN", "ADMIN_EMPRESA", "OPERADOR"],
      },
      {
        title: "Actividades",
        href: "/actividades",
        icon: ListTodo,
        roles: ["SUPER_ADMIN", "ADMIN_EMPRESA", "OPERADOR"],
      },
    ],
  },
  {
    id: "analisis",
    title: "Análisis",
    items: [
      {
        title: "Reportes ejecutivos",
        href: "/reportes",
        icon: BarChart3,
      },
    ],
  },
  {
    id: "sistema",
    title: "Sistema",
    items: [
      {
        title: "Configuración",
        href: "/configuracion",
        icon: Settings,
        roles: ["SUPER_ADMIN", "ADMIN_EMPRESA"],
      },
    ],
  },
];

export function filterNavItemByRole(item: NavItem, role: UserRole): boolean {
  if (!item.roles) return true;
  return item.roles.includes(role);
}

export function filterNavSectionsByRole(role: UserRole): NavSection[] {
  return navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => filterNavItemByRole(item, role)),
    }))
    .filter((section) => section.items.length > 0);
}

/** Lista plana (p. ej. menú móvil) */
export function filterNavByRole(role: UserRole): NavItem[] {
  return filterNavSectionsByRole(role).flatMap((s) => s.items);
}
