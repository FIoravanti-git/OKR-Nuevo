function isYmd(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/** Inicio del día UTC */
export function parseReportDateFrom(s: string | null): Date | null {
  if (!s || !isYmd(s)) return null;
  return new Date(`${s}T00:00:00.000Z`);
}

/** Fin del día UTC */
export function parseReportDateTo(s: string | null): Date | null {
  if (!s || !isYmd(s)) return null;
  return new Date(`${s}T23:59:59.999Z`);
}
