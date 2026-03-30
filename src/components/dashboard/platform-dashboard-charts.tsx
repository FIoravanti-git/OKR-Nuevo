"use client";

import type { ReactNode } from "react";
import type { PlatformDashboardChartsPayload } from "@/lib/dashboard/charts-data";
import {
  chartTooltipContentStyle,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
} from "@/components/dashboard/chart-tooltip-props";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SuperAdminDashboardStats } from "@/lib/dashboard/stats";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--primary)",
  "var(--chart-3)",
  "var(--chart-4)",
];

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

type Props = {
  stats: SuperAdminDashboardStats;
  charts: PlatformDashboardChartsPayload;
};

export function PlatformDashboardCharts({ stats, charts }: Props) {
  const volumeData = [
    { label: "Empresas", short: "Empresas", value: stats.companies, fill: "var(--chart-1)" },
    { label: "Usuarios", short: "Usuarios", value: stats.users, fill: "var(--chart-2)" },
    { label: "Proyectos inst.", short: "Proyectos", value: stats.institutionalProjects, fill: "var(--chart-3)" },
    { label: "Obj. institucionales", short: "Obj. inst.", value: stats.institutionalObjectives, fill: "var(--primary)" },
    { label: "Obj. estratégicos", short: "Obj. estr.", value: stats.strategicObjectives, fill: "var(--chart-4)" },
    { label: "Resultados clave", short: "KR", value: stats.keyResults, fill: "var(--chart-5)" },
    { label: "Actividades", short: "Activ.", value: stats.activities, fill: "var(--ring)" },
  ];

  const activityPieData = charts.activitiesByStatus.map((row) => ({
    name: row.label,
    value: row.count,
  }));

  const totalEntities = volumeData.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="min-h-0 border-border/80 bg-card/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Panorama multi-empresa</CardTitle>
        <CardDescription>
          Volúmenes globales de la plataforma y distribución de actividades por estado (todos los tenants).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <section aria-labelledby="dash-platform-volumes">
          <h3 id="dash-platform-volumes" className="mb-3 text-sm font-medium text-foreground">
            Inventario agregado
          </h3>
          {totalEntities === 0 ? (
            <ChartEmpty title="Plataforma vacía">
              Aún no hay empresas ni datos operativos. Los totales aparecerán aquí cuando existan registros.
            </ChartEmpty>
          ) : (
            <div className="h-[280px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={volumeData} margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} allowDecimals={false} />
                  <YAxis type="category" dataKey="short" width={72} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval={0} />
                  <Tooltip
                    formatter={(v: number) => [v.toLocaleString("es"), "Registros"]}
                    labelFormatter={(_, payload) => (payload?.[0]?.payload as { label?: string })?.label ?? ""}
                    contentStyle={chartTooltipContentStyle}
                    labelStyle={chartTooltipLabelStyle}
                    itemStyle={chartTooltipItemStyle}
                  />
                  <Bar dataKey="value" name="Cantidad" radius={[0, 4, 4, 0]} barSize={16}>
                    {volumeData.map((entry) => (
                      <Cell key={entry.label} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section aria-labelledby="dash-platform-activities">
          <h3 id="dash-platform-activities" className="mb-3 text-sm font-medium text-foreground">
            Actividades por estado (global)
          </h3>
          {activityPieData.length === 0 ? (
            <ChartEmpty title="Sin actividades">
              No hay actividades en ningún tenant, o no hay datos para agrupar.
            </ChartEmpty>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 md:items-center">
              <div className="h-[220px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={78}
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
                      formatter={(v: number) => [v.toLocaleString("es"), "Actividades"]}
                      contentStyle={chartTooltipContentStyle}
                      labelStyle={chartTooltipLabelStyle}
                      itemStyle={chartTooltipItemStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2 text-sm">
                {charts.activitiesByStatus.map((row, i) => (
                  <li key={row.status} className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background/50 px-3 py-2">
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
          )}
        </section>
      </CardContent>
    </Card>
  );
}
