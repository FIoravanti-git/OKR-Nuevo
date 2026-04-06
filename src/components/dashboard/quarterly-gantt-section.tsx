"use client";

import { useMemo, useState } from "react";
import type { ActivityStatus } from "@/generated/prisma";
import type { CompanyDashboardChartsPayload } from "@/lib/dashboard/charts-data";
import { activityStatusLabel } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const WEEK_COL_PX = 44;

type QuarterRef = { year: number; quarter: 1 | 2 | 3 | 4 };

type WeekSlice = {
  start: Date;
  end: Date;
  label: string;
};

function utcDate(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function quarterStart(ref: QuarterRef): Date {
  return new Date(Date.UTC(ref.year, (ref.quarter - 1) * 3, 1, 0, 0, 0, 0));
}

function quarterEnd(ref: QuarterRef): Date {
  return new Date(Date.UTC(ref.year, ref.quarter * 3, 0, 23, 59, 59, 999));
}

function startOfWeekMonday(d: Date): Date {
  const x = utcDate(d);
  const dow = x.getUTCDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  x.setUTCDate(x.getUTCDate() + offset);
  return x;
}

function endOfWeekSunday(d: Date): Date {
  const s = startOfWeekMonday(d);
  s.setUTCDate(s.getUTCDate() + 6);
  s.setUTCHours(23, 59, 59, 999);
  return s;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

function daysBetweenInclusive(a: Date, b: Date): number {
  return Math.floor((utcDate(b).getTime() - utcDate(a).getTime()) / 86_400_000) + 1;
}

function parseIso(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

function quarterLabel(ref: QuarterRef): string {
  return `T${ref.quarter} ${ref.year}`;
}

function quarterFromDate(d: Date): QuarterRef {
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  return { year: d.getUTCFullYear(), quarter: q as 1 | 2 | 3 | 4 };
}

function quarterKey(ref: QuarterRef): string {
  return `${ref.year}-Q${ref.quarter}`;
}

function buildQuarterWeeks(ref: QuarterRef): WeekSlice[] {
  const qStart = quarterStart(ref);
  const qEnd = quarterEnd(ref);
  const start = startOfWeekMonday(qStart);
  const end = endOfWeekSunday(qEnd);
  const weeks: WeekSlice[] = [];
  for (let cur = start; cur.getTime() <= end.getTime(); cur = addDays(cur, 7)) {
    const wStart = cur;
    const wEnd = addDays(cur, 6);
    weeks.push({
      start: wStart,
      end: wEnd,
      label: `${formatDateShort(wStart)}–${formatDateShort(wEnd)}`,
    });
  }
  return weeks;
}

function clampIntervalToQuarter(start: Date, end: Date, qStart: Date, qEnd: Date): [Date, Date] | null {
  const s = start.getTime() < qStart.getTime() ? qStart : start;
  const e = end.getTime() > qEnd.getTime() ? qEnd : end;
  if (s.getTime() > e.getTime()) return null;
  return [s, e];
}

function laneFromDates(params: {
  start: Date | null;
  end: Date | null;
  qStart: Date;
  qEnd: Date;
  totalDays: number;
}): { leftPct: number; widthPct: number } | null {
  const { start, end, qStart, qEnd, totalDays } = params;
  if (!start || !end) return null;
  const clamped = clampIntervalToQuarter(start, end, qStart, qEnd);
  if (!clamped) return null;
  const [s, e] = clamped;
  const leftDays = daysBetweenInclusive(qStart, s) - 1;
  const widthDays = daysBetweenInclusive(s, e);
  return {
    leftPct: (leftDays / totalDays) * 100,
    widthPct: Math.max((widthDays / totalDays) * 100, 1.2),
  };
}

function executionState(params: {
  status: ActivityStatus;
  plannedEnd: Date | null;
  actualEnd: Date | null;
  progressPercent: number | null;
}): "on-time" | "risk" | "late" | "blocked" {
  const { status, plannedEnd, actualEnd, progressPercent } = params;
  if (status === "BLOCKED") return "blocked";
  const today = utcDate(new Date());
  if (status === "DONE") {
    if (plannedEnd && actualEnd && actualEnd.getTime() > plannedEnd.getTime()) return "late";
    return "on-time";
  }
  if (plannedEnd && today.getTime() > plannedEnd.getTime()) return "late";
  if ((progressPercent ?? 0) < 40) return "risk";
  return "on-time";
}

function executionBarClass(state: "on-time" | "risk" | "late" | "blocked"): string {
  if (state === "late") return "bg-destructive/80";
  if (state === "risk") return "bg-amber-500/80";
  if (state === "blocked") return "bg-amber-700/60 border border-dashed border-amber-300/70";
  return "bg-emerald-500/85";
}

export function QuarterlyGanttSection({ data }: { data: CompanyDashboardChartsPayload | null }) {
  if (!data) return null;
  const rows = data.quarterlyGantt.activities;
  if (rows.length === 0) {
    return (
      <Card className="border-border/80 bg-card/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Gantt trimestral</CardTitle>
          <CardDescription>
            Cuando haya actividades con fechas, vas a ver aquí la comparación de plan y ejecución.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const allDates = rows
    .flatMap((r) => [r.plannedStart, r.plannedEnd, r.actualStart, r.actualEnd])
    .map(parseIso)
    .filter((d): d is Date => d != null);
  const todayQuarter = quarterFromDate(new Date());
  const minDate = allDates.length > 0 ? new Date(Math.min(...allDates.map((d) => d.getTime()))) : new Date();
  const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates.map((d) => d.getTime()))) : new Date();
  const minQuarter = quarterFromDate(minDate);
  const maxQuarter = quarterFromDate(maxDate);

  const quarterOptions = useMemo(() => {
    const options: QuarterRef[] = [];
    const startIndex = minQuarter.year * 4 + (minQuarter.quarter - 1);
    const endIndex = maxQuarter.year * 4 + (maxQuarter.quarter - 1);
    const safeStart = Math.min(startIndex, todayQuarter.year * 4 + (todayQuarter.quarter - 1) - 2);
    const safeEnd = Math.max(endIndex, todayQuarter.year * 4 + (todayQuarter.quarter - 1) + 2);
    for (let i = safeStart; i <= safeEnd; i += 1) {
      const year = Math.floor(i / 4);
      const quarter = ((i % 4) + 1) as 1 | 2 | 3 | 4;
      options.push({ year, quarter });
    }
    return options;
  }, [minQuarter.year, minQuarter.quarter, maxQuarter.year, maxQuarter.quarter, todayQuarter.year, todayQuarter.quarter]);

  const defaultQuarterKey = quarterKey(todayQuarter);
  const [quarterKeyState, setQuarterKeyState] = useState(
    quarterOptions.some((q) => quarterKey(q) === defaultQuarterKey)
      ? defaultQuarterKey
      : quarterKey(quarterOptions[quarterOptions.length - 1] ?? todayQuarter)
  );
  const [areaFilter, setAreaFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ActivityStatus>("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [groupByKr, setGroupByKr] = useState(false);
  const [collapsedAreas, setCollapsedAreas] = useState<string[]>([]);

  const quarterRef = useMemo(() => {
    const [y, q] = quarterKeyState.split("-Q");
    const yy = Number(y);
    const qq = Number(q) as 1 | 2 | 3 | 4;
    return Number.isFinite(yy) && qq >= 1 && qq <= 4 ? { year: yy, quarter: qq } : todayQuarter;
  }, [quarterKeyState, todayQuarter]);

  const qStart = quarterStart(quarterRef);
  const qEnd = quarterEnd(quarterRef);
  const weeks = buildQuarterWeeks(quarterRef);
  const totalDays = daysBetweenInclusive(qStart, qEnd);

  const areaOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.areaName))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );
  const projectOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.projectTitle))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );
  const assigneeOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.assigneeName).filter((x): x is string => Boolean(x)))).sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    return rows
      .filter((r) => (areaFilter === "all" ? true : r.areaName === areaFilter))
      .filter((r) => (projectFilter === "all" ? true : r.projectTitle === projectFilter))
      .filter((r) => (statusFilter === "all" ? true : r.status === statusFilter))
      .filter((r) => (assigneeFilter === "all" ? true : (r.assigneeName ?? "Sin responsable") === assigneeFilter))
      .filter((r) => {
        const planned = laneFromDates({
          start: parseIso(r.plannedStart),
          end: parseIso(r.plannedEnd),
          qStart,
          qEnd,
          totalDays,
        });
        const actualStart = parseIso(r.actualStart);
        const actualEndRaw = parseIso(r.actualEnd);
        const fallbackExecEnd =
          r.status === "IN_PROGRESS" && actualStart
            ? (() => {
                const today = utcDate(new Date());
                if (r.progressPercent != null && parseIso(r.plannedEnd)) {
                  const pEnd = parseIso(r.plannedEnd)!;
                  const span = Math.max(daysBetweenInclusive(actualStart, pEnd), 1);
                  const byProgress = addDays(actualStart, Math.floor((span * Math.max(0, Math.min(100, r.progressPercent))) / 100));
                  return byProgress.getTime() < today.getTime() ? byProgress : today;
                }
                return today;
              })()
            : null;
        const actual = laneFromDates({
          start: actualStart,
          end: actualEndRaw ?? fallbackExecEnd,
          qStart,
          qEnd,
          totalDays,
        });
        return Boolean(planned || actual);
      });
  }, [rows, areaFilter, projectFilter, statusFilter, assigneeFilter, qStart, qEnd, totalDays]);

  const grouped = useMemo(() => {
    const byArea = new Map<string, typeof filteredRows>();
    for (const row of filteredRows) {
      const list = byArea.get(row.areaName) ?? [];
      list.push(row);
      byArea.set(row.areaName, list);
    }
    return [...byArea.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredRows]);

  const groupedByAreaAndKr = useMemo(() => {
    const result = new Map<string, Map<string, typeof filteredRows>>();
    for (const row of filteredRows) {
      const byKr = result.get(row.areaName) ?? new Map<string, typeof filteredRows>();
      const list = byKr.get(row.keyResultTitle) ?? [];
      list.push(row);
      byKr.set(row.keyResultTitle, list);
      result.set(row.areaName, byKr);
    }
    return [...result.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([areaName, byKr]) => ({
        areaName,
        keyResults: [...byKr.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([keyResultTitle, items]) => ({ keyResultTitle, items })),
      }));
  }, [filteredRows]);

  const areasCollapsible = areaFilter === "all";
  const isAreaCollapsed = (areaName: string): boolean =>
    areasCollapsible && collapsedAreas.includes(areaName);
  const toggleAreaCollapse = (areaName: string) => {
    if (!areasCollapsible) return;
    setCollapsedAreas((prev) =>
      prev.includes(areaName) ? prev.filter((x) => x !== areaName) : [...prev, areaName]
    );
  };

  function renderActivityRow(r: (typeof filteredRows)[number]) {
    const plannedStart = parseIso(r.plannedStart);
    const plannedEnd = parseIso(r.plannedEnd);
    const actualStart = parseIso(r.actualStart);
    const actualEnd = parseIso(r.actualEnd);
    const today = utcDate(new Date());
    const fallbackExecEnd =
      r.status === "IN_PROGRESS" && actualStart
        ? (() => {
            if (r.progressPercent != null && plannedEnd) {
              const span = Math.max(daysBetweenInclusive(actualStart, plannedEnd), 1);
              const byProgress = addDays(
                actualStart,
                Math.floor((span * Math.max(0, Math.min(100, r.progressPercent))) / 100)
              );
              return byProgress.getTime() < today.getTime() ? byProgress : today;
            }
            return today;
          })()
        : null;
    const plannedLane = laneFromDates({
      start: plannedStart,
      end: plannedEnd,
      qStart,
      qEnd,
      totalDays,
    });
    const actualLane = laneFromDates({
      start: actualStart,
      end: actualEnd ?? fallbackExecEnd,
      qStart,
      qEnd,
      totalDays,
    });
    const execState = executionState({
      status: r.status,
      plannedEnd,
      actualEnd,
      progressPercent: r.progressPercent,
    });

    const tooltipText = [
      r.title,
      `Resultado: ${r.keyResultTitle}`,
      `Estado: ${activityStatusLabel(r.status)}`,
      `Responsable: ${r.assigneeName ?? "Sin responsable"}`,
      `Plan: ${plannedStart ? formatDateShort(plannedStart) : "—"} a ${plannedEnd ? formatDateShort(plannedEnd) : "—"}`,
      `Real: ${actualStart ? formatDateShort(actualStart) : "—"} a ${actualEnd ? formatDateShort(actualEnd) : r.status === "IN_PROGRESS" ? "En curso" : "—"}`,
      `Avance: ${r.progressPercent != null ? `${Math.round(r.progressPercent)}%` : "Sin dato"}`,
    ].join("\n");

    return (
      <div key={r.id} className="grid grid-cols-[320px_1fr] border-t border-border/40">
        <div className="px-3 py-2">
          <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {r.keyResultTitle} · {activityStatusLabel(r.status)}
          </p>
        </div>
        <div
          className="relative"
          style={{
            height: 44,
            backgroundImage: `repeating-linear-gradient(to right, transparent, transparent ${WEEK_COL_PX - 1}px, hsl(var(--border)) ${WEEK_COL_PX}px)`,
          }}
          title={tooltipText}
        >
          {plannedLane ? (
            <div
              className="absolute top-[8px] h-3 rounded-sm bg-muted-foreground/40"
              style={{ left: `${plannedLane.leftPct}%`, width: `${plannedLane.widthPct}%` }}
            />
          ) : null}
          {actualLane ? (
            <div
              className={`absolute top-[24px] h-3 rounded-sm ${executionBarClass(execState)}`}
              style={{ left: `${actualLane.leftPct}%`, width: `${actualLane.widthPct}%` }}
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <Card className="border-border/80 bg-card/60 shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Gantt trimestral</CardTitle>
        <CardDescription>
          Vista del trimestre por semanas para comparar planificación y ejecución de actividades.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-8 rounded-lg border border-border/80 bg-background px-2.5 text-sm"
            value={quarterKeyState}
            onChange={(e) => setQuarterKeyState(e.target.value)}
            aria-label="Trimestre"
          >
            {quarterOptions.map((q) => (
              <option key={quarterKey(q)} value={quarterKey(q)}>
                {quarterLabel(q)}
              </option>
            ))}
          </select>
          <select className="h-8 rounded-lg border border-border/80 bg-background px-2.5 text-sm" value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} aria-label="Área">
            <option value="all">Todas las áreas</option>
            {areaOptions.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <select className="h-8 rounded-lg border border-border/80 bg-background px-2.5 text-sm" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} aria-label="Proyecto">
            <option value="all">Todos los proyectos</option>
            {projectOptions.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <select className="h-8 rounded-lg border border-border/80 bg-background px-2.5 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | ActivityStatus)} aria-label="Estado">
            <option value="all">Todos los estados</option>
            <option value="PLANNED">Planificada</option>
            <option value="IN_PROGRESS">En progreso</option>
            <option value="DONE">Hecha</option>
            <option value="BLOCKED">Bloqueada</option>
            <option value="CANCELLED">Cancelada</option>
          </select>
          <select className="h-8 rounded-lg border border-border/80 bg-background px-2.5 text-sm" value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} aria-label="Responsable">
            <option value="all">Todos los responsables</option>
            <option value="Sin responsable">Sin responsable</option>
            {assigneeOptions.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setGroupByKr((v) => !v)}
            className="h-8 rounded-lg border border-border/80 bg-background px-2.5 text-sm text-foreground"
            aria-pressed={groupByKr}
          >
            {groupByKr ? "Agrupar por resultado: Sí" : "Agrupar por resultado: No"}
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border/70">
          <div className="min-w-[1000px]">
            <div className="sticky top-0 z-10 grid grid-cols-[320px_1fr] border-b border-border/70 bg-muted/30">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Actividad
              </div>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${weeks.length}, ${WEEK_COL_PX}px)` }}>
                {weeks.map((w, idx) => (
                  <div key={`${w.label}-${idx}`} className="border-l border-border/50 px-1 py-2 text-center text-[10px] text-muted-foreground">
                    <p className="font-semibold">S{idx + 1}</p>
                    <p>{w.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {grouped.length === 0 ? (
              <div className="px-4 py-8 text-sm text-muted-foreground">No hay actividades para ese filtro/trimestre.</div>
            ) : groupByKr ? (
              groupedByAreaAndKr.map((areaGroup) => (
                <div key={areaGroup.areaName} className="border-b border-border/60">
                  <button
                    type="button"
                    onClick={() => toggleAreaCollapse(areaGroup.areaName)}
                    className="flex w-full items-center justify-between bg-background/70 px-3 py-2 text-left text-sm font-semibold text-foreground"
                    aria-expanded={!isAreaCollapsed(areaGroup.areaName)}
                    disabled={!areasCollapsible}
                  >
                    <span>{areaGroup.areaName}</span>
                    {areasCollapsible ? (
                      <span className="text-xs font-medium text-muted-foreground">
                        {isAreaCollapsed(areaGroup.areaName) ? "Mostrar" : "Ocultar"}
                      </span>
                    ) : null}
                  </button>
                  {!isAreaCollapsed(areaGroup.areaName)
                    ? areaGroup.keyResults.map((krGroup) => (
                        <div key={`${areaGroup.areaName}-${krGroup.keyResultTitle}`} className="border-t border-border/40">
                          <div className="bg-muted/15 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                            Resultado: {krGroup.keyResultTitle}
                          </div>
                          {krGroup.items.map((r) => renderActivityRow(r))}
                        </div>
                      ))
                    : null}
                </div>
              ))
            ) : (
              grouped.map(([areaName, areaRows]) => (
                <div key={areaName} className="border-b border-border/60">
                  <button
                    type="button"
                    onClick={() => toggleAreaCollapse(areaName)}
                    className="flex w-full items-center justify-between bg-background/70 px-3 py-2 text-left text-sm font-semibold text-foreground"
                    aria-expanded={!isAreaCollapsed(areaName)}
                    disabled={!areasCollapsible}
                  >
                    <span>{areaName}</span>
                    {areasCollapsible ? (
                      <span className="text-xs font-medium text-muted-foreground">
                        {isAreaCollapsed(areaName) ? "Mostrar" : "Ocultar"}
                      </span>
                    ) : null}
                  </button>
                  {!isAreaCollapsed(areaName) ? areaRows.map((r) => renderActivityRow(r)) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-sm bg-muted-foreground/40" /> Planificado</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-sm bg-emerald-500/85" /> Ejecutado en tiempo</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-sm bg-amber-500/80" /> En riesgo</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-sm bg-destructive/80" /> Atrasado</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-sm border border-dashed border-amber-300/70 bg-amber-700/60" /> Bloqueada</span>
        </div>
      </CardContent>
    </Card>
  );
}
