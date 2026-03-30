"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

export type AnimatedProgressBarProps = {
  value: number | null | undefined;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
  size?: "sm" | "md" | "lg";
  /** Duración de la transición cuando no hay reducción de movimiento (solo transform). */
  durationMs?: number;
};

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

/**
 * Barra de progreso animada con scaleX (composición en GPU, sin relayout por width).
 * Montaje y cambios de valor animan con la misma transición CSS.
 */
export function AnimatedProgressBar({
  value,
  className,
  trackClassName,
  fillClassName,
  size = "sm",
  durationMs = 700,
}: AnimatedProgressBarProps) {
  const reducedMotion = usePrefersReducedMotion();
  const target = value == null || Number.isNaN(Number(value)) ? null : clampPct(Number(value));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const t = target ?? 0;
    const id = requestAnimationFrame(() => setDisplay(t));
    return () => cancelAnimationFrame(id);
  }, [target]);

  const h = size === "lg" ? "h-3" : size === "md" ? "h-2.5" : "h-2";
  const ms = reducedMotion ? 0 : durationMs;
  const ease = "cubic-bezier(0.33, 1, 0.68, 1)";

  if (target === null) {
    return (
      <div
        className={cn("w-full overflow-hidden rounded-full bg-muted/80", h, trackClassName, className)}
        aria-hidden
      >
        <div className="h-full w-0" />
      </div>
    );
  }

  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-muted/80", h, trackClassName, className)}
      role="progressbar"
      aria-valuenow={Math.round(display)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full w-full origin-left rounded-full bg-gradient-to-r from-primary/85 to-primary motion-reduce:transition-none",
          fillClassName
        )}
        style={{
          transform: `scaleX(${display / 100})`,
          transition: ms <= 0 ? "none" : `transform ${ms}ms ${ease}`,
        }}
      />
    </div>
  );
}
