import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  description?: string;
  href?: string;
  className?: string;
};

export function MetricCard({ icon: Icon, label, value, description, href, className }: MetricCardProps) {
  const body = (
    <>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium leading-snug text-muted-foreground">{label}</CardTitle>
        <div
          className="shrink-0 rounded-lg bg-primary/[0.08] p-2 text-primary ring-1 ring-primary/10 dark:bg-primary/15 dark:ring-primary/20"
          aria-hidden
        >
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
        {description ? (
          <CardDescription className="mt-1.5 text-pretty leading-relaxed">{description}</CardDescription>
        ) : null}
      </CardContent>
    </>
  );

  const cardClass = cn(
    "h-full border-border/70 bg-card/90 shadow-sm shadow-black/[0.025] backdrop-blur-sm transition-[box-shadow,transform,border-color] duration-200 dark:shadow-none",
    href && "hover:border-primary/25 hover:shadow-md hover:shadow-primary/5",
    className
  );

  if (href) {
    return (
      <Link href={href} className="group block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        <Card className={cn(cardClass, "group-hover:-translate-y-0.5")}>{body}</Card>
      </Link>
    );
  }

  return <Card className={cardClass}>{body}</Card>;
}
