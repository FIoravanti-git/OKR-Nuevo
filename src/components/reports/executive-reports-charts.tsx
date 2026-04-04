"use client";

import type { ReactNode } from "react";
import {
  CountPieTooltip,
  ProgressBarFullTooltip,
  rechartsTooltipWrapperStyle,
} from "@/components/dashboard/recharts-tooltips";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { activityStatusLabel } from "@/lib/format";
import type { ExecutiveReportPayload } from "@/lib/reports/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--primary)",
  "var(--chart-3)",
  "var(--chart-4)",
];

const RC_TOOLTIP_SAFE =
  "[&_.recharts-responsive-container]:overflow-visible [&_.recharts-wrapper]:overflow-visible";

const tooltipBoxClass =
  "rounded-md border border-border bg-popover px-3 py-2.5 text-left text-sm text-popover-foreground shadow-lg";

function ChartEmpty({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div
      className="flex min-h-[140px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border/70 bg-muted/25 px-4 py-6 text-center"
      role="status"
    >
      {title ? <p className="text-sm font-medium text-foreground">{title}</p> : null}
      <p className="max-w-md text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function EvolutionLineTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: unknown; payload?: { label?: string } } | undefined>;
}) {
  if (!active || !payload?.length || !payload[0]) return null;
  const row = payload[0].payload;
  const label = String(row?.label ?? "").trim();
  const raw = payload[0].value;
  const n = typeof raw === "number" ? raw : Number(raw);
  const pct = Number.isNaN(n) ? String(raw) : `${n.toLocaleString("es", { maximumFractionDigits: 1 })} %`;
  return (
    <div className={tooltipBoxClass} style={{ maxWidth: "min(96vw, 20rem)" }}>
      <p className="font-semibold leading-snug">{label || "Período"}</p>
      <p className="mt-2 text-xs tabular-nums">
        <span className="text-muted-foreground">Promedio de avance (KR):</span> {pct}
      </p>
    </div>
  );
}

type ExecutiveReportsChartsProps = {
  data: ExecutiveReportPayload;
};

export function ExecutiveReportsCharts({ data }: ExecutiveReportsChartsProps) {
  const { progressEvolution, progressEvolutionGranularity, progressEvolutionHint } = data;

  const ioBarData = data.ioProgress
    .filter(
      (r) => r.impactsGeneralProgress && r.progress != null && Number.isFinite(r.progress)
    )
    .map((r) => ({
      name: r.title.length > 30 ? `${r.title.slice(0, 29)}…` : r.title,
      fullTitle: r.title,
      progress: r.progress as number,
    }));

  const activityPieData = data.activitiesByStatus.map((row) => ({
    name: activityStatusLabel(row.status),
    value: row.count,
    status: row.status,
  }));

  const lineData = progressEvolution;

  const ioChartHeight = Math.min(520, Math.max(200, 72 + ioBarData.length * 26));

  return (
    <Card className="border-border/80 shadow-sm overflow-visible">
      <CardHeader>
        <CardTitle className="text-base">Visualizaciones</CardTitle>
        <CardDescription>
          Datos con los mismos filtros del reporte. La evolución usa el historial de avance de resultados clave
          (promedio del porcentaje registrado por período
          {progressEvolutionGranularity === "week" ? ", agrupado por semana" : ", agrupado por mes"}).
          {progressEvolutionHint ? ` ${progressEvolutionHint}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-8 overflow-visible">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Evolución temporal del avance (KR)
          </p>
          {lineData.length === 0 ? (
            <ChartEmpty title="Sin serie temporal">
              No hay registros de avance de resultados clave en el período y alcance seleccionados. Los avances se
              registran al editar un resultado clave o al recalcular.
            </ChartEmpty>
          ) : (
            <div className={`h-[260px] w-full min-w-0 ${RC_TOOLTIP_SAFE}`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    interval="preserveStartEnd"
                    angle={lineData.length > 8 ? -35 : 0}
                    textAnchor={lineData.length > 8 ? "end" : "middle"}
                    height={lineData.length > 8 ? 64 : 32}
                  />
                  <YAxis
                    domain={[0, 100]}
                    width={36}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickFormatter={(v) => `${v}`}
                  />
                  <Tooltip
                    wrapperStyle={rechartsTooltipWrapperStyle}
                    allowEscapeViewBox={{ x: true, y: true }}
                    content={(props) => <EvolutionLineTooltip {...props} />}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgProgress"
                    name="Avance medio"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--primary)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Avance por objetivo institucional
            </p>
            {ioBarData.length === 0 ? (
              <ChartEmpty title="Sin objetivos con avance numérico">
                Ningún objetivo institucional en alcance tiene porcentaje de avance para graficar.
              </ChartEmpty>
            ) : (
              <div className={`w-full min-w-0 ${RC_TOOLTIP_SAFE}`} style={{ height: ioChartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={ioBarData} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickFormatter={(v) => `${v}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      interval={0}
                    />
                    <Tooltip
                      wrapperStyle={rechartsTooltipWrapperStyle}
                      allowEscapeViewBox={{ x: true, y: true }}
                      content={(props) => <ProgressBarFullTooltip {...props} />}
                    />
                    <Bar dataKey="progress" name="Avance" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Actividades por estado
            </p>
            {activityPieData.length === 0 ? (
              <ChartEmpty title="Sin actividades en el criterio">
                No hay actividades que coincidan con empresa, proyecto, fechas y estado seleccionados.
              </ChartEmpty>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 sm:items-center">
                <div className={`mx-auto h-[200px] w-full max-w-[280px] min-w-0 ${RC_TOOLTIP_SAFE}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={72}
                        paddingAngle={2}
                        label={false}
                      >
                        {activityPieData.map((_, i) => (
                          <Cell
                            key={`cell-${i}`}
                            fill={PIE_COLORS[i % PIE_COLORS.length] ?? "var(--chart-1)"}
                            stroke="var(--card)"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        wrapperStyle={rechartsTooltipWrapperStyle}
                        allowEscapeViewBox={{ x: true, y: true }}
                        content={(props) => <CountPieTooltip {...props} />}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-2 text-sm">
                  {activityPieData.map((row, i) => (
                    <li
                      key={row.status}
                      className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background/50 px-3 py-2"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] ?? "var(--chart-1)" }}
                          aria-hidden
                        />
                        <span className="text-foreground">{row.name}</span>
                      </span>
                      <span className="tabular-nums font-medium text-muted-foreground">
                        {row.value.toLocaleString("es")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
