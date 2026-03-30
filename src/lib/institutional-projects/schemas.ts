import { z } from "zod";

function trimToUndef(s: string): string | undefined {
  const t = s.trim();
  return t === "" ? undefined : t;
}

export const institutionalProjectFormSchema = z.object({
  title: z.string().trim().min(2, "Mínimo 2 caracteres").max(200, "Máximo 200 caracteres"),
  description: z.string().max(8000).transform(trimToUndef),
  mission: z.string().max(4000).transform(trimToUndef),
  vision: z.string().max(4000).transform(trimToUndef),
  year: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : undefined;
  }, z.number().int().min(1900).max(2100).optional()),
  methodology: z.string().max(256).transform(trimToUndef),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  companyId: z.string().transform((s) => trimToUndef(s)),
});

export type InstitutionalProjectFormValues = z.infer<typeof institutionalProjectFormSchema>;

export const institutionalProjectStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);
