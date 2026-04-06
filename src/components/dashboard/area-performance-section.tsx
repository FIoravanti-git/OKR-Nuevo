"use client";

import { AlertTriangle, Clock3, Sparkles, TrendingUp } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CompanyDashboardChartsPayload } from "@/lib/dashboard/charts-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { rechartsTooltipWrapperStyle } from "./recharts-tooltips";

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--primary)",
  "var(--chart-5)",
];

function statusLabel(status: "ON_TRACK" | "AT_RISK" | "LATE"): string {
  if (status === "LATE") return "Atrasado";
  if (status === "AT_RISK") return "En riesgo";
  return "En tiempo";
}

function statusClass(status: "ON_TRACK" | "AT_RISK" | "LATE"): string {
  if (status === "LATE") {
    return "border-destructive/25 bg-destructive/10 text-destructive";
  }
  if (status === "AT_RISK") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }
  return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
}

function contributionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: Record<string, unknown>; value?: unknown } | undefined>;
}) {
  if (!active || !payload?.length || !payload[0]) return null;
  const row = payload[0].payload;
  if (!row) return null;
  const area = String(row.areaName ?? "").trim();
  const contribution = Number(row.contributionPercent ?? payload[0].value ?? 0);
  const progress = Number(row.progressPercent ?? 0);
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg">
      <p className="font-semibold">{area || "Área"}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Aporte al avance general: {contribution.toLocaleString("es", { maximumFractionDigits: 1 })}%
      </p>
      <p className="text-xs text-muted-foreground">
        Progreso del área: {progress.toLocaleString("es", { maximumFractionDigits: 1 })}%
      </p>
    </div>
  );
}

export function AreaPerformanceSection({ data }: { data: CompanyDashboardChartsPayload | null }) {
  if (!data) return null;

  const areas = data.areaPerformance.areas;
  if (areas.length === 0) {
    return (
      <Card className="border-border/80 bg-card/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Desempeño por área</CardTitle>
          <CardDescription>
            Esta vista aparece cuando hay resultados clave vinculados a áreas que participan del avance general.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const pieData = areas.map((area) => ({
    areaName: area.areaName,
    contributionPercent: area.contributionPercent,
    progressPercent: area.progressPercent,
  }));

  return (
    <section className="space-y-4" aria-labelledby="dash-area-performance">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="dash-area-performance" className="text-base font-semibold text-foreground">
            Desempeño por área
          </h2>
          <p className="text-sm text-muted-foreground">
            Cómo contribuye cada área al progreso general usando solo objetivos que sí entran en el avance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <AlertTriangle className="size-3.5" />
            {data.areaPerformance.atRiskAreas.toLocaleString("es")} en riesgo
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <Sparkles className="size-3.5" />
            {data.areaPerformance.highestImpactAreaIds.length.toLocaleString("es")} de mayor impacto
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="border-border/80 bg-card/60 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Contribución al avance</CardTitle>
            <CardDescription>Participación relativa de cada área en el progreso general.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mx-auto h-[240px] w-full max-w-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="contributionPercent"
                    nameKey="areaName"
                    cx="50%"
                    cy="50%"
                    innerRadius={64}
                    outerRadius={92}
                    paddingAngle={2}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`area-cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length] ?? "var(--chart-1)"} />
                    ))}
                  </Pie>
                  <Tooltip
                    wrapperStyle={rechartsTooltipWrapperStyle}
                    allowEscapeViewBox={{ x: true, y: true }}
                    content={(props) => contributionTooltip(props)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-3">
          {areas.map((area) => {
            const isTopImpact = data.areaPerformance.highestImpactAreaIds.includes(area.areaId);
            return (
              <Card key={area.areaId} className="border-border/80 bg-card/70 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-1 text-sm">{area.areaName}</CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-2">
                    <Badge className={statusClass(area.status)}>{statusLabel(area.status)}</Badge>
                    {isTopImpact ? (
                      <Badge variant="outline" className="gap-1.5">
                        <TrendingUp className="size-3.5" />
                        Mayor impacto
                      </Badge>
                    ) : null}
                    {area.overdueActivities > 0 ? (
                      <Badge variant="outline" className="gap-1.5">
                        <Clock3 className="size-3.5" />
                        {area.overdueActivities.toLocaleString("es")} vencidas
                      </Badge>
                    ) : null}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Progreso</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {area.progressPercent.toLocaleString("es", { maximumFractionDigits: 1 })}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Aporte</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {area.contributionPercent.toLocaleString("es", { maximumFractionDigits: 1 })}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Peso total</p>
                    <p className="font-medium tabular-nums">{area.totalWeight.toLocaleString("es")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Actividades</p>
                    <p className="font-medium tabular-nums">{area.activitiesCount.toLocaleString("es")}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="border-border/80 bg-card/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Detalle por área</CardTitle>
          <CardDescription>Resumen consolidado para seguimiento ejecutivo y operativo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Área</TableHead>
                <TableHead className="text-right">Progreso</TableHead>
                <TableHead className="text-right">Peso</TableHead>
                <TableHead className="text-right">Actividades</TableHead>
                <TableHead className="text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.map((area) => (
                <TableRow key={`area-row-${area.areaId}`}>
                  <TableCell className="font-medium text-foreground">{area.areaName}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {area.progressPercent.toLocaleString("es", { maximumFractionDigits: 1 })}%
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{area.totalWeight.toLocaleString("es")}</TableCell>
                  <TableCell className="text-right tabular-nums">{area.activitiesCount.toLocaleString("es")}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={statusClass(area.status)}>{statusLabel(area.status)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
