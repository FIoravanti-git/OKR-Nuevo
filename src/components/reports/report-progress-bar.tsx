import { cn } from "@/lib/utils";

export function ReportProgressBar({
  value,
  className,
}: {
  value: number | null;
  className?: string;
}) {
  const pct = value == null || Number.isNaN(value) ? 0 : Math.min(100, Math.max(0, value));
  const has = value != null && !Number.isNaN(value);

  return (
    <div className={cn("flex min-w-[100px] max-w-[180px] flex-col gap-1", className)}>
      <div className="h-2 overflow-hidden rounded-full bg-muted/90">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all",
            !has && "opacity-25"
          )}
          style={{ width: `${has ? pct : 0}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">
        {has ? `${pct.toFixed(1)}%` : "Sin dato"}
      </span>
    </div>
  );
}
