import { History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { activityStatusLabel } from "@/lib/format";

type LogRow = {
  id: string;
  createdAt: Date;
  activityTitle: string;
  newProgress: string | null;
  newStatus: string | null;
};

function formatWhen(d: Date): string {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

type OperatorRecentProgressProps = {
  items: LogRow[];
};

export function OperatorRecentProgress({ items }: OperatorRecentProgressProps) {
  return (
    <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-muted p-2 text-muted-foreground">
            <History className="size-4" aria-hidden />
          </div>
          <div>
            <CardTitle className="text-base font-medium">Avances recientes</CardTitle>
            <CardDescription>Últimos registros que registraste en actividades.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            Aún no hay registros de avance a tu nombre. Cuando actualices actividades, aparecerán aquí.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map((row) => (
              <li key={row.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{row.activityTitle}</p>
                  <p className="text-xs text-muted-foreground">{formatWhen(row.createdAt)}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 text-xs text-muted-foreground sm:justify-end">
                  {row.newProgress != null ? (
                    <span className="rounded-md bg-muted px-2 py-0.5 font-medium tabular-nums text-foreground">
                      Avance {row.newProgress}%
                    </span>
                  ) : null}
                  {row.newStatus ? (
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">
                      {activityStatusLabel(row.newStatus)}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
