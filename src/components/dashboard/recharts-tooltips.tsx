"use client";

import type { CSSProperties } from "react";

/** Evita que el wrapper de Recharts recorte el contenido largo. */
export const rechartsTooltipWrapperStyle: CSSProperties = {
  zIndex: 9999,
  outline: "none",
  overflow: "visible",
  pointerEvents: "auto",
};

const boxClass =
  "max-h-[min(70vh,32rem)] overflow-y-auto rounded-md border border-border bg-popover px-3 py-2.5 text-left text-sm text-popover-foreground shadow-lg";

const titleClass = "font-semibold leading-snug break-words [overflow-wrap:anywhere]";
const metaClass =
  "mt-1 text-xs leading-snug text-muted-foreground break-words [overflow-wrap:anywhere]";
const valueClass = "mt-2 text-xs tabular-nums text-popover-foreground";

function pctText(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return `${n.toLocaleString("es", { maximumFractionDigits: 1 })} %`;
}

type Payload = ReadonlyArray<{ value?: unknown; payload?: Record<string, unknown> } | undefined>;

function readPayload(active: boolean | undefined, payload: Payload | undefined) {
  if (!active || !payload?.length) return null;
  const first = payload[0];
  if (!first) return null;
  return { value: first.value, row: first.payload };
}

/** Barras horizontales/verticales con título largo + porcentaje. */
export function ProgressBarFullTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Payload;
}) {
  const data = readPayload(active, payload);
  if (!data) return null;
  const title = String(data.row?.fullTitle ?? data.row?.titleFull ?? "").trim();
  if (!title) return null;
  return (
    <div className={boxClass} style={{ maxWidth: "min(96vw, 36rem)", minWidth: "12rem" }}>
      <p className={titleClass}>{title}</p>
      <p className={valueClass}>
        <span className="text-muted-foreground">Avance:</span> {pctText(data.value)}
      </p>
    </div>
  );
}

/** Resultado clave: título + objetivo estratégico + avance (texto completo, varias líneas). */
export function KeyResultBarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Payload;
}) {
  const data = readPayload(active, payload);
  if (!data) return null;
  const title = String(data.row?.titleFull ?? "").trim();
  const objective = String(data.row?.objectiveTitleFull ?? "").trim();
  return (
    <div className={boxClass} style={{ maxWidth: "min(96vw, 36rem)", minWidth: "12rem" }}>
      {title ? <p className={titleClass}>{title}</p> : null}
      {objective ? <p className={metaClass}>{objective}</p> : null}
      <p className={valueClass}>
        <span className="text-muted-foreground">Avance:</span> {pctText(data.value)}
      </p>
    </div>
  );
}

type PiePayloadEntry = { name?: string | number; value?: unknown };

/** Donut portafolio (dos series). */
export function PortfolioDonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<PiePayloadEntry | undefined>;
}) {
  if (!active || !payload?.length || !payload[0]) return null;
  const { name, value } = payload[0];
  const nameStr = String(name ?? "").trim();
  const n = typeof value === "number" ? value : Number(value);
  const text = Number.isNaN(n) ? String(value) : `${n.toLocaleString("es")} %`;
  const heading =
    nameStr === "Avance"
      ? "Avance portafolio"
      : nameStr === "Pendiente"
        ? "Restante (meta 100%)"
        : nameStr || "Detalle";
  return (
    <div className={boxClass} style={{ maxWidth: "min(96vw, 20rem)" }}>
      <p className={titleClass}>{heading}</p>
      <p className={valueClass}>{text}</p>
    </div>
  );
}

/** Torta de conteos (actividades por estado). */
export function CountPieTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<PiePayloadEntry | undefined>;
  label?: unknown;
}) {
  if (!active || !payload?.length || !payload[0]) return null;
  const statusName = String(label ?? payload[0].name ?? "").trim();
  const raw = payload[0].value;
  const n = typeof raw === "number" ? raw : Number(raw);
  const count = Number.isNaN(n) ? String(raw) : n.toLocaleString("es");
  return (
    <div className={boxClass} style={{ maxWidth: "min(96vw, 28rem)" }}>
      <p className={titleClass}>{statusName || "Estado"}</p>
      <p className={valueClass}>
        <span className="text-muted-foreground">Actividades:</span> {count}
      </p>
    </div>
  );
}
