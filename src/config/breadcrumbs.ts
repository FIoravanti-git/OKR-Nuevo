/** Etiquetas para breadcrumb por ruta (exacta o prefijo en `getCurrentPageLabel`). */
export const routePageLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/companies": "Empresas",
  "/companies/nueva": "Nueva empresa",
  "/usuarios": "Usuarios",
  "/usuarios/nuevo": "Nuevo usuario",
  "/areas": "Áreas",
  "/areas/nuevo": "Nueva área",
  "/equipo": "Equipo",
  "/proyecto": "Proyecto institucional",
  "/proyecto/nuevo": "Nuevo proyecto",
  "/objetivos": "Objetivos institucionales",
  "/objetivos/nuevo": "Nuevo objetivo",
  "/objetivos-clave": "Objetivos clave",
  "/objetivos-clave/nuevo": "Nuevo objetivo clave",
  "/resultados-clave": "Resultados clave",
  "/resultados-clave/nuevo": "Nuevo resultado clave",
  "/actividades": "Actividades",
  "/actividades/nuevo": "Nueva actividad",
  "/reportes": "Reportes ejecutivos",
  "/configuracion": "Configuración",
};

export function getCurrentPageLabel(pathname: string): string {
  if (routePageLabels[pathname]) {
    return routePageLabels[pathname];
  }
  const keys = Object.keys(routePageLabels).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (pathname.startsWith(`${key}/`)) {
      return routePageLabels[key];
    }
  }
  return "Vista";
}
