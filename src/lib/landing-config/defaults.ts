import type { LandingPageConfig } from "./types";

const DEFAULT_NAV_LINKS = [
  { href: "#beneficios", label: "Beneficios" },
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#producto", label: "Producto" },
  { href: "#planes", label: "Planes" },
  { href: "#testimonios", label: "Clientes" },
];

const DEFAULT_BENEFITS = [
  { id: "b1", title: "Alineación estratégica", description: "Conectá objetivos institucionales con la operación: cada KR y actividad aporta al mismo norte medible.", iconKey: "layers", sortOrder: 0, status: "ACTIVE" as const },
  { id: "b2", title: "Métricas y ponderaciones", description: "Pesos explícitos y lectura de impacto: lo importante pesa más, sin debates interminables sobre prioridades.", iconKey: "percent", sortOrder: 1, status: "ACTIVE" as const },
  { id: "b3", title: "Seguimiento en tiempo real", description: "Avances, ponderaciones y salud de progreso visibles para líderes y equipos sin depender de reportes manuales.", iconKey: "gauge", sortOrder: 2, status: "ACTIVE" as const },
  { id: "b4", title: "Control por áreas", description: "Departamentos, responsables y permisos claros: gobernanza real para empresas con varias líneas de negocio.", iconKey: "shield", sortOrder: 3, status: "ACTIVE" as const },
  { id: "b5", title: "Dashboards ejecutivos", description: "Lectura rápida del estado del trimestre: foco en riesgos, cuellos de botella y oportunidades de recuperación.", iconKey: "line-chart", sortOrder: 4, status: "ACTIVE" as const },
  { id: "b6", title: "Dependencias y planificación", description: "Actividades enlazadas con orden y secuencia: menos sorpresas, más previsibilidad en la ejecución.", iconKey: "git-branch", sortOrder: 5, status: "ACTIVE" as const },
  { id: "b7", title: "En cualquier dispositivo", description: "Experiencia responsive e instalable como PWA para reuniones, planta o trabajo híbrido.", iconKey: "smartphone", sortOrder: 6, status: "ACTIVE" as const },
];

const DEFAULT_FEATURES = [
  { id: "f1", title: "Objetivos y KR", description: "Objetivos institucionales, objetivos clave y resultados clave con métricas, metas y ponderación coherente.", iconKey: "target", sortOrder: 0, status: "ACTIVE" as const },
  { id: "f2", title: "Actividades", description: "Desglose accionable con responsables, fechas y estado: la ejecución queda atada a los OKR.", iconKey: "calendar-range", sortOrder: 1, status: "ACTIVE" as const },
  { id: "f3", title: "Dashboard ejecutivo", description: "Resumen visual de avance, áreas y salud de progreso para decisiones rápidas en comité.", iconKey: "layout-dashboard", sortOrder: 2, status: "ACTIVE" as const },
  { id: "f4", title: "Gestión por áreas", description: "Estructura por departamentos con responsables y contexto multiempresa cuando lo necesitás.", iconKey: "building-2", sortOrder: 3, status: "ACTIVE" as const },
  { id: "f5", title: "Reportes", description: "Lectura por área y cortes ejecutivos para auditorías internas y seguimiento de management.", iconKey: "bar-chart-3", sortOrder: 4, status: "ACTIVE" as const },
  { id: "f6", title: "Gantt semanal", description: "Planificación compacta de la semana con foco en dependencias y entregables críticos.", iconKey: "square-chart-gantt", sortOrder: 5, status: "ACTIVE" as const },
  { id: "f7", title: "Seguimiento trimestral", description: "Ritmo de negocio alineado al calendario corporativo: checkpoints sin perder agilidad.", iconKey: "users", sortOrder: 6, status: "ACTIVE" as const },
  { id: "f8", title: "PWA / App empresarial", description: "Instalación en escritorio y móvil, acceso rápido y experiencia similar a app nativa.", iconKey: "smartphone", sortOrder: 7, status: "ACTIVE" as const },
];

const DEFAULT_DIFF_POINTS = [
  { id: "d1", title: "Enfoque empresarial real", description: "No es un tablero genérico: está pensado para jerarquías, áreas y responsables como operan las compañías medianas y grandes.", iconKey: "factory", sortOrder: 0, status: "ACTIVE" as const },
  { id: "d2", title: "Planificación + ejecución", description: "Los OKR dejan de vivir en una slide: se traducen en actividades con dueños, fechas y dependencias visibles.", iconKey: "compass", sortOrder: 1, status: "ACTIVE" as const },
  { id: "d3", title: "Control por áreas", description: "Cada líder ve su territorio con contexto global. Dirección mira el portafolio completo sin perder el detalle.", iconKey: "users-2", sortOrder: 2, status: "ACTIVE" as const },
  { id: "d4", title: "Estratégico y operativo", description: "Seguimiento trimestral con ritmo semanal: conectás la ambición del board con el calendario del equipo.", iconKey: "line-chart", sortOrder: 3, status: "ACTIVE" as const },
];

const DEFAULT_PLANS = [
  {
    id: "p1",
    name: "Starter",
    description: "Equipos que recién estructuran OKRs y necesitan foco sin fricción.",
    priceLabel: "USD 49",
    periodLabel: "/mes",
    features: ["Hasta 10 usuarios", "Dashboard básico", "Gestión OKR completa", "Soporte estándar (ticket)"],
    isHighlighted: false,
    highlightLabel: null,
    buttonText: "Iniciar sesión",
    buttonUrl: "/login",
    showPrice: true,
    sortOrder: 0,
    status: "ACTIVE" as const,
  },
  {
    id: "p2",
    name: "Business",
    description: "Empresas en crecimiento con varias áreas y reporting a dirección.",
    priceLabel: "USD 149",
    periodLabel: "/mes",
    features: [
      "Hasta 50 usuarios",
      "Áreas y responsables",
      "Reportes ejecutivos",
      "Dashboard avanzado",
      "PWA / app instalable",
      "Soporte prioritario",
    ],
    isHighlighted: true,
    highlightLabel: "Más elegido",
    buttonText: "Solicitar demo",
    buttonUrl: "#contacto",
    showPrice: true,
    sortOrder: 1,
    status: "ACTIVE" as const,
  },
  {
    id: "p3",
    name: "Enterprise",
    description: "Grupos corporativos con integraciones, gobernanza y acompañamiento dedicado.",
    priceLabel: "Personalizado",
    periodLabel: null,
    features: [
      "Usuarios ilimitados",
      "Personalización y marca",
      "Onboarding a medida",
      "Soporte dedicado",
      "Módulos avanzados",
      "Integración empresarial (SSO, API, etc.)",
    ],
    isHighlighted: false,
    highlightLabel: null,
    buttonText: "Hablar con ventas",
    buttonUrl: "mailto:ventas@okrstack.com?subject=OKR%20Stack%20Enterprise",
    showPrice: true,
    sortOrder: 2,
    status: "ACTIVE" as const,
  },
];

const DEFAULT_TESTIMONIALS = [
  {
    id: "t1",
    name: "Mariana Vidal",
    roleCompany: "COO · Grupo Andina Retail",
    comment:
      "Pasamos de reuniones reactivas a un comité semanal con los mismos números para todos. El salto fue tener dependencias explícitas entre equipos.",
    avatarUrl: null,
    sortOrder: 0,
    status: "ACTIVE" as const,
  },
  {
    id: "t2",
    name: "Lucas Ferreyra",
    roleCompany: "Director de Operaciones · Logística SUR",
    comment:
      "Probamos hojas y Notion; se desincronizaban. Con OKR Stack el área ve su avance y dirección ve el consolidado sin armar otro Excel.",
    avatarUrl: null,
    sortOrder: 1,
    status: "ACTIVE" as const,
  },
  {
    id: "t3",
    name: "Paula Méndez",
    roleCompany: "Chief of Staff · Fintech PagoRápido",
    comment:
      "La PWA nos salvó en viajes y visitas a socios. Instalás la app y tenés el tablero como si fuera herramienta interna, no un sitio web olvidado.",
    avatarUrl: null,
    sortOrder: 2,
    status: "ACTIVE" as const,
  },
];

const DEFAULT_FOOTER_LINKS = [
  { id: "fl1", label: "Beneficios", href: "#beneficios", sortOrder: 0, status: "ACTIVE" as const },
  { id: "fl2", label: "Funcionalidades", href: "#funcionalidades", sortOrder: 1, status: "ACTIVE" as const },
  { id: "fl3", label: "Producto", href: "#producto", sortOrder: 2, status: "ACTIVE" as const },
  { id: "fl4", label: "Planes", href: "#planes", sortOrder: 3, status: "ACTIVE" as const },
  { id: "fl5", label: "Diferencial", href: "#diferencial", sortOrder: 4, status: "ACTIVE" as const },
  { id: "fl6", label: "Clientes", href: "#testimonios", sortOrder: 5, status: "ACTIVE" as const },
  { id: "fl7", label: "Contacto", href: "#contacto", sortOrder: 6, status: "ACTIVE" as const },
];

export function getDefaultLandingPageConfig(): LandingPageConfig {
  return {
    productName: "OKR Stack",
    hero: {
      title: "OKR Stack: estrategia que se ejecuta, no que se archiva.",
      subtitle:
        "La plataforma empresarial para alinear objetivos institucionales, resultados clave y actividades con métricas, ponderaciones y visibilidad ejecutiva en tiempo real.",
      primaryButtonText: "Solicitar demo",
      primaryButtonUrl: "#contacto",
      secondaryButtonText: "Iniciar sesión",
      secondaryButtonUrl: "/login",
      showSecondaryButton: true,
      footnote:
        "Onboarding guiado · Seguridad pensada para equipos distribuidos · Experiencia tipo app en móvil y escritorio",
      badge1: "Instalable como app (PWA)",
      badge2: "Multiempresa · Roles y permisos",
    },
    nav: {
      logoUrl: null,
      brandName: "OKR Stack",
      loginButtonText: "Iniciar sesión",
      showDemoButton: true,
      demoButtonText: "Solicitar demo",
      demoButtonUrl: "#contacto",
      links: DEFAULT_NAV_LINKS,
    },
    benefits: {
      eyebrow: "Beneficios",
      title: "De la hoja de ruta al tablero semanal, sin perder el hilo",
      subtitle:
        "OKR Stack está pensado para organizaciones que necesitan claridad estratégica y disciplina operativa al mismo tiempo.",
      items: DEFAULT_BENEFITS,
    },
    features: {
      eyebrow: "Funcionalidades",
      title: "Todo lo que esperás de un stack OKR serio",
      subtitle:
        "Un solo lugar para planificar, ponderar, ejecutar y reportar. Sin hojas sueltas ni versiones desactualizadas.",
      items: DEFAULT_FEATURES,
    },
    preview: {
      eyebrow: "Vista previa",
      title: "Un tablero que tu dirección va a querer abrir todos los lunes",
      subtitle:
        "Progreso consolidado, foco en áreas y lectura de riesgos en segundos. Así se ve cuando estrategia y operación comparten el mismo lenguaje.",
      badgeText: "Mock visual · no requiere datos reales",
      progressPercent: "68%",
      bars: [
        { label: "On track", width: "72%", tone: "bg-kr-health-good/85" },
        { label: "Atención", width: "18%", tone: "bg-kr-health-warn/85" },
        { label: "Crítico", width: "10%", tone: "bg-destructive/70" },
      ],
      areas: [
        { name: "Operaciones", value: 78 },
        { name: "Producto & Tech", value: 64 },
        { name: "Revenue", value: 82 },
        { name: "People", value: 71 },
      ],
      krs: [
        { title: "NPS trimestral ≥ 45", status: "En curso", dot: "bg-chart-2" },
        { title: "Churn bajo 2,2%", status: "Riesgo", dot: "bg-kr-health-warn" },
        { title: "Time-to-value −20%", status: "On track", dot: "bg-kr-health-good" },
      ],
      activities: [
        { title: "Kickoff pricing", date: "Mar 12", progress: "90%" },
        { title: "Integración BI", date: "Mar 18", progress: "45%" },
        { title: "Playbook ventas", date: "Mar 22", progress: "60%" },
      ],
    },
    differentiator: {
      eyebrow: "Por qué OKR Stack",
      title: "Cuando la estrategia necesita dueños, fechas y evidencia",
      subtitle:
        "Herramientas de tareas ayudan a ejecutar. OKR Stack suma la capa que explica por qué esa ejecución importa y cómo se acerca a la meta.",
      points: DEFAULT_DIFF_POINTS,
    },
    pricing: {
      eyebrow: "Planes y precios",
      title: "Inversión clara, valor medible",
      subtitle:
        "Elegí el punto de partida. Migrá de plan cuando tu organización escala sin rearmar todo desde cero.",
      plans: DEFAULT_PLANS,
    },
    testimonials: {
      eyebrow: "Testimonios",
      title: "Equipos que ya no confunden actividad con impacto",
      subtitle: "Referencias simuladas con fines demostrativos.",
      items: DEFAULT_TESTIMONIALS,
    },
    cta: {
      title: "Agendá una demo guiada con tu caso de uso",
      subtitle:
        "Te mostramos OKR Stack con datos de ejemplo o, si preferís, armamos un recorrido sobre tus áreas y roles reales bajo NDA.",
      buttonText: "Solicitar demo por correo",
      buttonUrl: "mailto:ventas@okrstack.com?subject=Demo%20OKR%20Stack",
      secondaryButtonText: "Iniciar sesión",
      secondaryButtonUrl: "/login",
      footnote: "Respuesta en menos de 24 h hábiles · demos en español · facturación internacional disponible",
    },
    footer: {
      brandText: "OKR Stack",
      description:
        "Plataforma empresarial para gestión estratégica y seguimiento de OKR, con foco en áreas, métricas y ejecución medible.",
      contactEmail: "ventas@okrstack.com",
      contactWhatsApp: null,
      copyrightLine: null,
      tagline: "Hecho para equipos que ejecutan con criterio, no solo con urgencia.",
      links: DEFAULT_FOOTER_LINKS,
    },
  };
}

/** Valores escalares mínimos para crear la fila singleton en base de datos. */
export function getDefaultLandingConfigScalars() {
  const d = getDefaultLandingPageConfig();
  return {
    productName: d.productName,
    heroTitle: d.hero.title,
    heroSubtitle: d.hero.subtitle,
    heroPrimaryButtonText: d.hero.primaryButtonText,
    heroPrimaryButtonUrl: d.hero.primaryButtonUrl,
    heroSecondaryButtonText: d.hero.secondaryButtonText,
    heroSecondaryButtonUrl: d.hero.secondaryButtonUrl,
    showSecondaryButton: d.hero.showSecondaryButton,
    heroFootnote: d.hero.footnote,
    heroBadge1: d.hero.badge1,
    heroBadge2: d.hero.badge2,
    brandName: d.nav.brandName,
    loginButtonText: d.nav.loginButtonText,
    showDemoButton: d.nav.showDemoButton,
    demoButtonText: d.nav.demoButtonText,
    demoButtonUrl: d.nav.demoButtonUrl,
    navLinksJson: d.nav.links,
    benefitsEyebrow: d.benefits.eyebrow,
    benefitsTitle: d.benefits.title,
    benefitsSubtitle: d.benefits.subtitle,
    featuresEyebrow: d.features.eyebrow,
    featuresTitle: d.features.title,
    featuresSubtitle: d.features.subtitle,
    previewEyebrow: d.preview.eyebrow,
    previewTitle: d.preview.title,
    previewSubtitle: d.preview.subtitle,
    previewBadgeText: d.preview.badgeText,
    previewProgressPercent: d.preview.progressPercent,
    previewBarsJson: d.preview.bars,
    previewAreasJson: d.preview.areas,
    previewKrsJson: d.preview.krs,
    previewActivitiesJson: d.preview.activities,
    differentiatorEyebrow: d.differentiator.eyebrow,
    differentiatorTitle: d.differentiator.title,
    differentiatorSubtitle: d.differentiator.subtitle,
    pricingEyebrow: d.pricing.eyebrow,
    pricingTitle: d.pricing.title,
    pricingSubtitle: d.pricing.subtitle,
    testimonialsEyebrow: d.testimonials.eyebrow,
    testimonialsTitle: d.testimonials.title,
    testimonialsSubtitle: d.testimonials.subtitle,
    ctaTitle: d.cta.title,
    ctaSubtitle: d.cta.subtitle,
    ctaButtonText: d.cta.buttonText,
    ctaButtonUrl: d.cta.buttonUrl,
    ctaSecondaryButtonText: d.cta.secondaryButtonText,
    ctaSecondaryButtonUrl: d.cta.secondaryButtonUrl,
    ctaFootnote: d.cta.footnote,
    footerBrandText: d.footer.brandText,
    footerDescription: d.footer.description,
    contactEmail: d.footer.contactEmail,
    contactWhatsApp: d.footer.contactWhatsApp,
    copyrightLine: d.footer.copyrightLine,
    footerTagline: d.footer.tagline,
  };
}
