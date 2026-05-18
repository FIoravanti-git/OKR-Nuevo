/** Si el valor enviado está vacío, conserva el actual (no borra en guardados parciales). */
export function keepIfEmpty(submitted: string | undefined | null, current: string | null | undefined): string | null {
  const t = submitted?.trim() ?? "";
  if (t === "") return current ?? null;
  return t;
}

export function keepStringWithDefault(
  submitted: string | undefined | null,
  current: string | null | undefined,
  fallback: string
): string {
  const t = submitted?.trim() ?? "";
  if (t !== "") return t;
  const c = current?.trim();
  if (c) return c;
  return fallback;
}

export function keepHexColor(
  submitted: string | undefined | null,
  current: string | null | undefined,
  fallback: string
): string {
  const t = submitted?.trim() ?? "";
  if (t === "") return current?.trim() || fallback;
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(t)) return t;
  return current?.trim() || fallback;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmailSimple(value: string): boolean {
  return EMAIL_RE.test(value);
}
