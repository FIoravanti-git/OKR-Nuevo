import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { keyResultProgressHealthLabel } from "@/lib/format";
import {
  type KeyResultProgressHealthLevel,
  keyResultProgressHealthFromPercent,
} from "@/lib/key-results/progress-health";
import { cn } from "@/lib/utils";

const STYLES: Record<KeyResultProgressHealthLevel, string> = {
  EN_RIESGO: "border-rose-500/40 bg-rose-500/10 text-rose-900 dark:text-rose-100",
  EN_ATENCION: "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100",
  EN_BUEN_ESTADO: "border-emerald-500/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
};

const ICONS = {
  EN_RIESGO: AlertTriangle,
  EN_ATENCION: AlertCircle,
  EN_BUEN_ESTADO: CheckCircle2,
} as const;

type KeyResultProgressHealthBadgeProps = {
  progressPercent: number | null;
  size?: "default" | "compact";
  className?: string;
};

/**
 * Semáforo según % consolidado: &lt;30%, 30–70%, &gt;70%.
 * Independiente del estado operativo del KR en base de datos.
 */
export function KeyResultProgressHealthBadge({
  progressPercent,
  size = "default",
  className,
}: KeyResultProgressHealthBadgeProps) {
  const level = keyResultProgressHealthFromPercent(progressPercent);
  if (!level) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1.5 border-dashed font-normal text-muted-foreground",
          size === "compact" && "h-5 gap-1 px-1.5 py-0 text-[10px]",
          className
        )}
        title="Sin porcentaje de avance consolidado para calcular el semáforo"
      >
        <span className="inline-block size-2 shrink-0 rounded-full bg-muted-foreground/35" aria-hidden />
        Sin dato de avance
      </Badge>
    );
  }
  const Icon = ICONS[level];
  return (
    <Badge
      className={cn(
        "gap-1.5 border font-normal",
        STYLES[level],
        size === "compact" && "h-5 gap-1 px-1.5 py-0 text-[10px] [&_svg]:size-3",
        className
      )}
      title="Semáforo automático según avance: &lt;30% en riesgo · 30–70% en atención · &gt;70% en buen estado"
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span>{keyResultProgressHealthLabel(level)}</span>
    </Badge>
  );
}
