import type { ReactNode } from "react";
import { History, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  activityStatusLabel,
  formatDateTime,
  keyResultProgressLogSourceLabel,
  keyResultStatusLabel,
} from "@/lib/format";
import type { ActivityStatus, KeyResultProgressLogSource, KeyResultStatus } from "@/generated/prisma";
function formatProgressCell(v: unknown): string {
  if (v == null) return "—";
  const n = Number(v);
  return Number.isFinite(n) ? `${n}%` : "—";
}

function formatMetricCell(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "object" && v !== null && "toString" in v) {
    return String((v as { toString: () => string }).toString());
  }
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : "—";
}

export type ActivityProgressHistoryItem = {
  id: string;
  createdAt: Date;
  previousProgress: unknown;
  newProgress: unknown;
  previousStatus: ActivityStatus | null;
  newStatus: ActivityStatus | null;
  note: string | null;
  changedBy: { name: string; email: string } | null;
};

export type KeyResultProgressHistoryItem = {
  id: string;
  createdAt: Date;
  source: KeyResultProgressLogSource;
  previousProgress: unknown;
  newProgress: unknown;
  previousCurrentValue: unknown;
  newCurrentValue: unknown;
  previousStatus: KeyResultStatus | null;
  newStatus: KeyResultStatus | null;
  note: string | null;
  changedBy: { name: string; email: string } | null;
};

function HistoryMeta({
  createdAt,
  changedBy,
  sourceBadge,
}: {
  createdAt: Date;
  changedBy: { name: string; email: string } | null;
  sourceBadge?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border/60 pb-3">
      <time className="text-xs font-medium tabular-nums text-muted-foreground">{formatDateTime(createdAt)}</time>
      {sourceBadge}
      {changedBy ? (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <User className="size-3 opacity-70" aria-hidden />
          <span className="font-medium text-foreground/90">{changedBy.name}</span>
          <span className="hidden sm:inline">({changedBy.email})</span>
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">Usuario no disponible</span>
      )}
    </div>
  );
}

export function ActivityProgressHistoryTimeline({ items }: { items: ActivityProgressHistoryItem[] }) {
  return (
    <Card className="border-border/80 shadow-sm" id="historial-cambios">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <History className="size-4 text-primary" aria-hidden />
          Historial de cambios
        </CardTitle>
        <CardDescription>
          Fecha, usuario, campo modificado, valores anterior y nuevo, y observación opcional.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay registros de cambios.</p>
        ) : (
          <ul className="space-y-8">
            {items.map((log) => {
              const progressRow =
                log.previousProgress != null || log.newProgress != null ? (
                  <TableRow key={`${log.id}-p`}>
                    <TableCell className="whitespace-normal font-medium text-muted-foreground">Avance</TableCell>
                    <TableCell className="tabular-nums">{formatProgressCell(log.previousProgress)}</TableCell>
                    <TableCell className="tabular-nums font-medium">{formatProgressCell(log.newProgress)}</TableCell>
                  </TableRow>
                ) : null;
              const statusRow =
                log.previousStatus != null && log.newStatus != null ? (
                  <TableRow key={`${log.id}-s`}>
                    <TableCell className="whitespace-normal font-medium text-muted-foreground">Estado</TableCell>
                    <TableCell>{activityStatusLabel(log.previousStatus)}</TableCell>
                    <TableCell className="font-medium">{activityStatusLabel(log.newStatus)}</TableCell>
                  </TableRow>
                ) : null;

              return (
                <li
                  key={log.id}
                  className="rounded-xl border border-border/70 bg-muted/10 p-4 shadow-sm dark:bg-muted/5"
                >
                  <HistoryMeta createdAt={log.createdAt} changedBy={log.changedBy} />
                  <Table className="mt-3">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[min(40%,12rem)]">Campo</TableHead>
                        <TableHead>Valor anterior</TableHead>
                        <TableHead>Valor nuevo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {progressRow}
                      {statusRow}
                    </TableBody>
                  </Table>
                  {!progressRow && !statusRow ? (
                    <p className="mt-2 text-xs text-muted-foreground">Sin detalle de campos en este registro.</p>
                  ) : null}
                  {log.note ? (
                    <blockquote className="mt-3 rounded-lg border border-border/60 bg-muted/25 px-3 py-2 text-sm text-foreground/90">
                      <span className="text-xs font-medium text-muted-foreground">Observación · </span>
                      {log.note}
                    </blockquote>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function KeyResultProgressHistoryTimeline({ items }: { items: KeyResultProgressHistoryItem[] }) {
  return (
    <Card className="border-border/80 shadow-sm" id="historial-cambios">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <History className="size-4 text-violet-600 dark:text-violet-400" aria-hidden />
          Historial de cambios
        </CardTitle>
        <CardDescription>
          Fecha, usuario, origen del registro, campo modificado, valores anterior y nuevo, y observación opcional.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay registros de cambios.</p>
        ) : (
          <ul className="space-y-8">
            {items.map((log) => {
              const progressRow =
                log.previousProgress != null || log.newProgress != null ? (
                  <TableRow key={`${log.id}-p`}>
                    <TableCell className="whitespace-normal font-medium text-muted-foreground">
                      Progreso consolidado
                    </TableCell>
                    <TableCell className="tabular-nums">{formatProgressCell(log.previousProgress)}</TableCell>
                    <TableCell className="tabular-nums font-medium">{formatProgressCell(log.newProgress)}</TableCell>
                  </TableRow>
                ) : null;
              const metricRow =
                log.previousCurrentValue != null || log.newCurrentValue != null ? (
                  <TableRow key={`${log.id}-m`}>
                    <TableCell className="whitespace-normal font-medium text-muted-foreground">
                      Valor actual (métrica)
                    </TableCell>
                    <TableCell className="tabular-nums">{formatMetricCell(log.previousCurrentValue)}</TableCell>
                    <TableCell className="tabular-nums font-medium">{formatMetricCell(log.newCurrentValue)}</TableCell>
                  </TableRow>
                ) : null;
              const statusRow =
                log.previousStatus != null && log.newStatus != null ? (
                  <TableRow key={`${log.id}-s`}>
                    <TableCell className="whitespace-normal font-medium text-muted-foreground">Estado</TableCell>
                    <TableCell>{keyResultStatusLabel(log.previousStatus)}</TableCell>
                    <TableCell className="font-medium">{keyResultStatusLabel(log.newStatus)}</TableCell>
                  </TableRow>
                ) : null;

              return (
                <li
                  key={log.id}
                  className="rounded-xl border border-border/70 bg-muted/10 p-4 shadow-sm dark:bg-muted/5"
                >
                  <HistoryMeta
                    createdAt={log.createdAt}
                    changedBy={log.changedBy}
                    sourceBadge={
                      <Badge variant="secondary" className="text-xs font-normal">
                        {keyResultProgressLogSourceLabel(log.source)}
                      </Badge>
                    }
                  />
                  <Table className="mt-3">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[min(40%,12rem)]">Campo</TableHead>
                        <TableHead>Valor anterior</TableHead>
                        <TableHead>Valor nuevo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {progressRow}
                      {metricRow}
                      {statusRow}
                    </TableBody>
                  </Table>
                  {!progressRow && !metricRow && !statusRow ? (
                    <p className="mt-2 text-xs text-muted-foreground">Sin detalle de campos en este registro.</p>
                  ) : null}
                  {log.note ? (
                    <blockquote className="mt-3 rounded-lg border border-border/60 bg-muted/25 px-3 py-2 text-sm text-foreground/90">
                      <span className="text-xs font-medium text-muted-foreground">Observación · </span>
                      {log.note}
                    </blockquote>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
