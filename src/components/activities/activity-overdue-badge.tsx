import { Badge } from "@/components/ui/badge";
import { activityOverdueLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

type ActivityOverdueBadgeProps = {
  className?: string;
  size?: "default" | "compact";
};

export function ActivityOverdueBadge({ className, size = "default" }: ActivityOverdueBadgeProps) {
  return (
    <Badge
      className={cn(
        "border-rose-600/35 bg-rose-600/12 font-medium text-rose-900 dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-100",
        size === "compact" && "h-5 px-1.5 py-0 text-[10px] font-normal",
        className
      )}
    >
      {activityOverdueLabel()}
    </Badge>
  );
}
