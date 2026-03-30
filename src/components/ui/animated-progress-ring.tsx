"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

type AnimatedProgressRingProps = {
  value: number | null;
  className?: string;
  durationMs?: number;
};

const R = 15.5;
const C = 2 * Math.PI * R;

/**
 * Anillo de progreso (p. ej. KPI de portafolio) con trazo animado al montar y al cambiar el valor.
 */
export function AnimatedProgressRing({ value, className, durationMs = 700 }: AnimatedProgressRingProps) {
  const reducedMotion = usePrefersReducedMotion();
  const raw = value != null && Number.isFinite(value) ? Number(value) : 0;
  const v = Math.min(100, Math.max(0, raw));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setDisplay(v));
    return () => cancelAnimationFrame(id);
  }, [v]);

  const offset = C * (1 - display / 100);
  const ms = reducedMotion ? 0 : durationMs;
  const ease = "cubic-bezier(0.33, 1, 0.68, 1)";

  return (
    <div className={cn("relative flex size-28 shrink-0 items-center justify-center", className)}>
      <svg className="size-28 -rotate-90" viewBox="0 0 36 36" aria-hidden>
        <circle
          cx="18"
          cy="18"
          r={R}
          fill="none"
          className="stroke-muted/60"
          strokeWidth="6"
        />
        <circle
          cx="18"
          cy="18"
          r={R}
          fill="none"
          className="stroke-primary motion-reduce:transition-none"
          strokeWidth="6"
          strokeDasharray={`${C}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: ms <= 0 ? "none" : `stroke-dashoffset ${ms}ms ${ease}`,
          }}
        />
      </svg>
      <span className="absolute text-center text-lg font-semibold tabular-nums text-foreground">
        {`${Math.round(display)}%`}
      </span>
    </div>
  );
}
