import type { CSSProperties } from "react";

/**
 * Estilos explícitos para tooltips de Recharts: evita texto invisible al hover/clic
 * (herencia incorrecta sobre fondos del tema).
 */
export const chartTooltipContentStyle: CSSProperties = {
  backgroundColor: "var(--popover)",
  color: "var(--popover-foreground)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  fontSize: "0.8125rem",
  boxShadow: "0 4px 20px oklch(0 0 0 / 0.14)",
};

export const chartTooltipLabelStyle: CSSProperties = {
  color: "var(--popover-foreground)",
  fontWeight: 600,
  marginBottom: 4,
};

export const chartTooltipItemStyle: CSSProperties = {
  color: "var(--popover-foreground)",
};
