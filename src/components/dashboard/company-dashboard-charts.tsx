"use client";

import type { ReactNode } from "react";
import type { CompanyDashboardChartsPayload } from "@/lib/dashboard/charts-data";
import { keyResultProgressHealthChartFill } from "@/lib/key-results/progress-health";
import {
  CountPieTooltip,
  KeyResultBarTooltip,
  PortfolioDonutTooltip,
  ProgressBarFullTooltip,
  rechartsTooltipWrapperStyle,
} from "@/components/dashboard/recharts-tooltips";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** Orden fijo por estado; mezcla tonos del tema para sectores bien diferenciados. */
const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--primary)",
  "var(--chart-3)",
  "var(--chart-4)",
];

/** Recharts aplica overflow:hidden y recorta tooltips con mucho texto. */
const RC_TOOLTIP_SAFE =
  "[&_.recharts-responsive-container]:overflow-visible [&_.recharts-wrapper]:overflow-visible";

function ChartEmpty({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div
      className="flex min-h-[120px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border/70 bg-muted/25 px-4 py-6 text-center"
      role="status"
    >
      {title ? <p className="text-sm font-medium text-foreground">{title}</p> : null}
      <p className="max-w-sm text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function ActivitiesByStatusContent({ data }: { data: CompanyDashboardChartsPayload }) {
  const activityPieData = data.activitiesByStatus.map((row) => ({
    name: row.label,
    value: row.count,
    status: row.status,
  }));

  if (activityPieData.length === 0) {
    return (
      <ChartEmpty title="Sin actividades">
        No hay actividades en tu empresa todavía, o todas están en estados sin registros agregados.
      </ChartEmpty>
    );
  }

  return (
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
        {data.activitiesByStatus.map((row, i) => (
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
              <span className="text-foreground">{row.label}</span>
            </span>
            <span className="tabular-nums font-medium text-muted-foreground">{row.count.toLocaleString("es")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KeyResultsRankingContent({
  data,
  chartsLayout = "responsive",
}: {
  data: CompanyDashboardChartsPayload;
  /** En columna angosta del dashboard conviene apilar siempre. */
  chartsLayout?: "responsive" | "stacked";
}) {
  const reducedMotion = usePrefersReducedMotion();
  const barAnimProps = {
    isAnimationActive: !reducedMotion,
    animationBegin: 0,
    animationDuration: reducedMotion ? 1 : 680,
    animationEasing: "ease-out" as const,
  };

  const krHighData = data.keyResultsHighest.map((k) => ({
    name: k.label.length > 24 ? `${k.label.slice(0, 23)}…` : k.label,
    titleFull: k.titleFull,
    objectiveTitleFull: k.objectiveTitleFull,
    progress: k.progressPercent,
  }));

  const krLowData = data.keyResultsLowest.map((k) => ({
    name: k.label.length > 24 ? `${k.label.slice(0, 23)}…` : k.label,
    titleFull: k.titleFull,
    objectiveTitleFull: k.objectiveTitleFull,
    progress: k.progressPercent,
  }));

  if (krHighData.length === 0 && krLowData.length === 0) {
    return (
      <ChartEmpty title="Sin resultados clave con avance">
        Los KR sin porcentaje cacheado no se listan. Actualizá avances en resultados clave para ver el ranking.
      </ChartEmpty>
    );
  }

  const gridClass = chartsLayout === "stacked" ? "grid gap-6" : "grid gap-6 lg:grid-cols-2";

  return (
    <div className={gridClass}>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Mayor avance</p>
        {krHighData.length === 0 ? (
          <ChartEmpty title="Vacío">No hay datos suficientes.</ChartEmpty>
        ) : (
          <div className={`h-[220px] w-full min-w-0 ${RC_TOOLTIP_SAFE}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={krHighData} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `${v}`} />
                <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval={0} />
                <Tooltip
                  wrapperStyle={rechartsTooltipWrapperStyle}
                  allowEscapeViewBox={{ x: true, y: true }}
                  content={(props) => <KeyResultBarTooltip {...props} />}
                />
                <Bar
                  {...barAnimProps}
                  dataKey="progress"
                  name="Avance"
                  radius={[0, 4, 4, 0]}
                  barSize={16}
                >
                  {krHighData.map((entry, index) => (
                    <Cell
                      key={`kr-h-${index}`}
                      fill={keyResultProgressHealthChartFill(entry.progress)}
                      stroke="var(--card)"
                      strokeWidth={1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Menor avance</p>
        {krLowData.length === 0 ? (
          <ChartEmpty title="Vacío">No hay datos suficientes.</ChartEmpty>
        ) : (
          <div className={`h-[220px] w-full min-w-0 ${RC_TOOLTIP_SAFE}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={krLowData} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `${v}`} />
                <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval={0} />
                <Tooltip
                  wrapperStyle={rechartsTooltipWrapperStyle}
                  allowEscapeViewBox={{ x: true, y: true }}
                  content={(props) => <KeyResultBarTooltip {...props} />}
                />
                <Bar
                  {...barAnimProps}
                  dataKey="progress"
                  name="Avance"
                  radius={[0, 4, 4, 0]}
                  barSize={16}
                >
                  {krLowData.map((entry, index) => (
                    <Cell
                      key={`kr-l-${index}`}
                      fill={keyResultProgressHealthChartFill(entry.progress)}
                      stroke="var(--card)"
                      strokeWidth={1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

/** Card lateral: ranking de KR (p. ej. debajo de actividades por estado). */
export function DashboardKeyResultsRankingCard({ data }: { data: CompanyDashboardChartsPayload | null }) {
  return (
    <Card className="border-border/80 bg-card/60 shadow-sm overflow-visible">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Resultados clave: mayor y menor avance</CardTitle>
        <CardDescription>
          Avance cacheado por KR. Color de barra: semáforo automático (&lt;30% riesgo · 30–70% atención · &gt;70%
          buen estado).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!data ? (
          <ChartEmpty title="Sin datos">No hay contexto de empresa para mostrar resultados clave.</ChartEmpty>
        ) : (
          <KeyResultsRankingContent data={data} chartsLayout="stacked" />
        )}
      </CardContent>
    </Card>
  );
}

type Props = {
  data: CompanyDashboardChartsPayload | null;
  heading?: string;
  description?: string;
  /** Si es false, no se renderiza la sección (p. ej. cuando va en otra columna del dashboard). */
  includeActivitiesByStatus?: boolean;
  /** Si es false, el ranking de KR se muestra fuera (p. ej. card en columna derecha). */
  includeKeyResultsRanking?: boolean;
};

export function CompanyDashboardCharts({
  data,
  heading = "Seguimiento de avance",
  description = "Progreso agregado, objetivos institucionales, actividades y resultados clave en tu organización.",
  includeActivitiesByStatus = true,
  includeKeyResultsRanking = true,
}: Props) {
  const reducedMotion = usePrefersReducedMotion();
  const barAnimProps = {
    isAnimationActive: !reducedMotion,
    animationBegin: 0,
    animationDuration: reducedMotion ? 1 : 680,
    animationEasing: "ease-out" as const,
  };

  if (!data) {
    return (
      <Card className="border-border/80 bg-card/60 shadow-sm overflow-visible">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{heading}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartEmpty title="Sin datos">
            No hay contexto de empresa cargado. Cuando tu usuario esté vinculado a una organización, verás gráficos con
            datos reales.
          </ChartEmpty>
        </CardContent>
      </Card>
    );
  }

  const portfolio = Math.round(data.portfolioProgressPercent * 10) / 10;
  const donutData = [
    { name: "Avance", value: Math.min(100, Math.max(0, portfolio)), key: "done" },
    { name: "Pendiente", value: Math.min(100, Math.max(0, 100 - portfolio)), key: "rest" },
  ];

  const hasProjects = data.projects.length > 0;
  const projectBarData = data.projects.map((p) => ({
    name: p.title.length > 22 ? `${p.title.slice(0, 21)}…` : p.title,
    fullTitle: p.titleFull,
    progress: Math.round(p.progressPercent * 10) / 10,
  }));

  const ioBarData = data.institutionalObjectives.map((o) => ({
    name: o.label.length > 28 ? `${o.label.slice(0, 27)}…` : o.label,
    fullTitle: o.titleFull,
    progress: o.progressPercent,
  }));

  return (
    <Card className="border-border/80 bg-card/60 shadow-sm overflow-visible">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{heading}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 overflow-visible">
        <section aria-labelledby="dash-chart-portfolio">
          <h3 id="dash-chart-portfolio" className="mb-3 text-sm font-medium text-foreground">
            Progreso general del portafolio
          </h3>
          {!hasProjects ? (
            <ChartEmpty title="Sin proyectos">
              Creá o activá un proyecto institucional para calcular el avance ponderado de la organización.
            </ChartEmpty>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 md:items-center">
              <div
                className={`relative mx-auto flex h-[200px] w-full max-w-[240px] items-center justify-center ${RC_TOOLTIP_SAFE}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={86}
                      startAngle={90}
                      endAngle={-270}
                      strokeWidth={0}
                    >
                      <Cell fill="var(--chart-1)" stroke="var(--card)" strokeWidth={2} />
                      <Cell fill="var(--muted)" fillOpacity={0.45} stroke="var(--card)" strokeWidth={2} />
                    </Pie>
                    <Tooltip
                      wrapperStyle={rechartsTooltipWrapperStyle}
                      allowEscapeViewBox={{ x: true, y: true }}
                      content={(props) => <PortfolioDonutTooltip {...props} />}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                    {portfolio.toLocaleString("es", { maximumFractionDigits: 1 })}%
                  </span>
                  <span className="text-xs text-muted-foreground">promedio proyectos</span>
                </div>
              </div>
              <div className="min-h-[200px] w-full min-w-0">
                {projectBarData.length === 1 ? (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{data.projects[0]?.title}</span>
                    <span className="mx-1">·</span>
                    avance calculado:{" "}
                    <span className="tabular-nums font-medium text-foreground">
                      {projectBarData[0]?.progress.toLocaleString("es", { maximumFractionDigits: 1 })}%
                    </span>
                  </p>
                ) : (
                  <div className={RC_TOOLTIP_SAFE}>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={projectBarData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval={0} angle={-18} dy={8} height={48} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={32} tickFormatter={(v) => `${v}`} />
                        <Tooltip
                          wrapperStyle={rechartsTooltipWrapperStyle}
                          allowEscapeViewBox={{ x: true, y: true }}
                          content={(props) => <ProgressBarFullTooltip {...props} />}
                        />
                        <Bar
                          {...barAnimProps}
                          dataKey="progress"
                          name="Avance"
                          fill="var(--chart-2)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={36}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <p className="mt-2 text-xs text-muted-foreground">Cada barra es el avance de un proyecto institucional (0–100%).</p>
              </div>
            </div>
          )}
        </section>

        {includeActivitiesByStatus ? (
          <section aria-labelledby="dash-chart-activities">
            <h3 id="dash-chart-activities" className="mb-3 text-sm font-medium text-foreground">
              Actividades por estado
            </h3>
            <ActivitiesByStatusContent data={data} />
          </section>
        ) : null}

        <section aria-labelledby="dash-chart-oi">
          <h3 id="dash-chart-oi" className="mb-3 text-sm font-medium text-foreground">
            Avance por objetivo institucional
          </h3>
          {ioBarData.length === 0 ? (
            <ChartEmpty title="Sin objetivos con avance">
              Cuando los objetivos institucionales tengan progreso calculado, aparecerán aquí ordenados alfabéticamente.
            </ChartEmpty>
          ) : (
            <div className={`h-[min(360px,50vh)] w-full min-w-0 ${RC_TOOLTIP_SAFE}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={ioBarData} margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `${v}%`} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    interval={0}
                  />
                  <Tooltip
                    wrapperStyle={rechartsTooltipWrapperStyle}
                    allowEscapeViewBox={{ x: true, y: true }}
                    content={(props) => <ProgressBarFullTooltip {...props} />}
                  />
                  <Bar
                    {...barAnimProps}
                    dataKey="progress"
                    name="Avance"
                    fill="var(--chart-3)"
                    radius={[0, 4, 4, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {includeKeyResultsRanking ? (
          <section aria-labelledby="dash-chart-kr">
            <h3 id="dash-chart-kr" className="mb-3 text-sm font-medium text-foreground">
              Resultados clave: mayor y menor avance
            </h3>
            <KeyResultsRankingContent data={data} />
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
