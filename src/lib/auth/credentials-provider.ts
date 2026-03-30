import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { UserRole } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const credentialsProvider = Credentials({
  id: "credentials",
  name: "Credenciales",
  credentials: {
    email: { label: "Correo", type: "email" },
    password: { label: "Contraseña", type: "password" },
  },
  authorize: async (credentials) => {
    const parsed = credentialsSchema.safeParse(credentials);
    if (!parsed.success) return null;

    const email = parsed.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user?.isActive) return null;

    if (user.companyId && user.company && !user.company.isActive) {
      return null;
    }

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!valid) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      companyId: user.companyId,
      companyName: user.company?.name ?? null,
    };
  },
});
