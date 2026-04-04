import { z } from "zod";
import type { UserRole } from "@/generated/prisma";

const roleEnum = z.enum(["SUPER_ADMIN", "ADMIN_EMPRESA", "OPERADOR"] satisfies [UserRole, UserRole, UserRole]);

function trimOrEmpty(s: string | undefined): string {
  return s == null ? "" : s.trim();
}

export const userCreateFormSchema = z
  .object({
    name: z.string().trim().min(2, "Mínimo 2 caracteres").max(120, "Máximo 120 caracteres"),
    email: z.string().trim().email("Correo no válido").max(255),
    password: z.string().min(8, "Mínimo 8 caracteres").max(128, "Máximo 128 caracteres"),
    role: roleEnum,
    companyId: z.string().optional(),
    areaId: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.string().min(1).optional()
    ),
    isActive: z.coerce.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.role !== "SUPER_ADMIN") {
      const cid = trimOrEmpty(data.companyId);
      if (!cid) {
        ctx.addIssue({
          code: "custom",
          message: "Seleccioná una empresa para este rol",
          path: ["companyId"],
        });
      }
    }
  });

export const userUpdateFormSchema = z
  .object({
    name: z.string().trim().min(2, "Mínimo 2 caracteres").max(120, "Máximo 120 caracteres"),
    email: z.string().trim().email("Correo no válido").max(255),
    password: z
      .string()
      .optional()
      .transform((s) => (s ?? "").trim())
      .refine((s) => s.length === 0 || (s.length >= 8 && s.length <= 128), {
        message: "Si completás contraseña, usá entre 8 y 128 caracteres",
      }),
    role: roleEnum,
    companyId: z.string().optional(),
    areaId: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.string().min(1).optional()
    ),
    isActive: z.coerce.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.role !== "SUPER_ADMIN") {
      const cid = trimOrEmpty(data.companyId);
      if (!cid) {
        ctx.addIssue({
          code: "custom",
          message: "Seleccioná una empresa para este rol",
          path: ["companyId"],
        });
      }
    }
  });

export type UserCreateFormValues = z.infer<typeof userCreateFormSchema>;
export type UserUpdateFormValues = z.infer<typeof userUpdateFormSchema>;
