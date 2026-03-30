/**
 * Seed idempotente para desarrollo (OKR multiempresa).
 *
 * Crea o actualiza (upsert) sin duplicar:
 * - 2 planes catálogo: Demo + Profesional
 * - 1 empresa demo (slug acme) + suscripción ACTIVE al plan Profesional
 * - 1 proyecto institucional ACTIVE
 * - Usuarios: SUPER_ADMIN, ADMIN_EMPRESA, 2× OPERADOR
 *
 * Contraseña de prueba (todos los usuarios seed): ver DEV_PASSWORD abajo.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma";
import type { UserRole } from "../src/generated/prisma";

/** Contraseña única para desarrollo; cambiar solo en entornos controlados. */
const DEV_PASSWORD = "Demo123!";

const IDS = {
  planDemo: "seed-plan-demo",
  planPro: "seed-plan-pro",
  subscriptionAcme: "seed-sub-acme",
  projectAcme: "seed-proj-acme",
} as const;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL es obligatoria para el seed");
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

async function upsertSeedUser(
  email: string,
  name: string,
  role: UserRole,
  companyId: string | null,
  passwordHash: string
) {
  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      role,
      companyId,
      passwordHash,
      isActive: true,
    },
    update: {
      name,
      role,
      companyId,
      passwordHash,
      isActive: true,
    },
  });
}

async function main() {
  const passwordHash = await hashPassword(DEV_PASSWORD);

  // --- Planes (catálogo; sin company_id) ---
  await prisma.plan.upsert({
    where: { id: IDS.planDemo },
    create: {
      id: IDS.planDemo,
      code: "demo",
      name: "Demo",
      description: "Plan base para desarrollo y pruebas locales.",
      maxUsers: 25,
    },
    update: {
      code: "demo",
      name: "Demo",
      description: "Plan base para desarrollo y pruebas locales.",
      maxUsers: 25,
    },
  });

  const planPro = await prisma.plan.upsert({
    where: { id: IDS.planPro },
    create: {
      id: IDS.planPro,
      code: "pro",
      name: "Profesional",
      description: "Plan de demostración con límites amplios.",
      maxUsers: 100,
    },
    update: {
      code: "pro",
      name: "Profesional",
      description: "Plan de demostración con límites amplios.",
      maxUsers: 100,
    },
  });

  // --- Empresa demo ---
  const company = await prisma.company.upsert({
    where: { slug: "acme" },
    create: {
      name: "Acme Corp (demo)",
      slug: "acme",
      maxUsers: 50,
    },
    update: {
      name: "Acme Corp (demo)",
      maxUsers: 50,
    },
  });

  // Suscripción activa al plan Profesional (la empresa demo usa el plan “completo”).
  await prisma.companySubscription.upsert({
    where: { id: IDS.subscriptionAcme },
    create: {
      id: IDS.subscriptionAcme,
      companyId: company.id,
      planId: planPro.id,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    },
    update: {
      planId: planPro.id,
      status: "ACTIVE",
      cancelAtPeriodEnd: false,
    },
  });

  // --- Proyecto institucional (puede haber varios por empresa) ---
  const project = await prisma.institutionalProject.upsert({
    where: { id: IDS.projectAcme },
    create: {
      id: IDS.projectAcme,
      companyId: company.id,
      title: "Plan estratégico institucional 2026",
      description: "Proyecto institucional raíz de la empresa (seed).",
      mission: "Crear valor sostenible para clientes y equipos.",
      vision: "Referente regional en excelencia operativa.",
      year: 2026,
      methodology: "OKR",
      status: "ACTIVE",
    },
    update: {
      title: "Plan estratégico institucional 2026",
      description: "Proyecto institucional raíz de la empresa (seed).",
      mission: "Crear valor sostenible para clientes y equipos.",
      vision: "Referente regional en excelencia operativa.",
      year: 2026,
      methodology: "OKR",
      status: "ACTIVE",
    },
  });

  // --- Usuarios (emails únicos → upsert seguro) ---
  await upsertSeedUser("super@okr.local", "Super Admin", "SUPER_ADMIN", null, passwordHash);
  await upsertSeedUser("admin@acme.okr", "Admin Acme", "ADMIN_EMPRESA", company.id, passwordHash);
  await upsertSeedUser("operador@acme.okr", "Operador Acme", "OPERADOR", company.id, passwordHash);
  await upsertSeedUser("operador2@acme.okr", "Operadora Acme", "OPERADOR", company.id, passwordHash);

  // eslint-disable-next-line no-console -- salida CLI
  console.log("\n✓ Seed completado (idempotente).\n");
  // eslint-disable-next-line no-console
  console.log("Contraseña de prueba (todos los usuarios):", DEV_PASSWORD);
  // eslint-disable-next-line no-console
  console.log("\nPlanes:");
  // eslint-disable-next-line no-console
  console.log(`  - Demo (id ${IDS.planDemo}, code demo)`);
  // eslint-disable-next-line no-console
  console.log(`  - Profesional (id ${IDS.planPro}, code pro) ← suscripción de Acme`);
  // eslint-disable-next-line no-console
  console.log("\nEmpresa:");
  // eslint-disable-next-line no-console
  console.log(`  - ${company.name} slug=acme id=${company.id}`);
  // eslint-disable-next-line no-console
  console.log(`  - Suscripción ACTIVE → plan Profesional`);
  // eslint-disable-next-line no-console
  console.log(`  - Proyecto institucional: "${project.title}"`);
  // eslint-disable-next-line no-console
  console.log("\nUsuarios:");
  // eslint-disable-next-line no-console
  console.log("  super@okr.local        SUPER_ADMIN");
  // eslint-disable-next-line no-console
  console.log("  admin@acme.okr         ADMIN_EMPRESA");
  // eslint-disable-next-line no-console
  console.log("  operador@acme.okr      OPERADOR");
  // eslint-disable-next-line no-console
  console.log("  operador2@acme.okr     OPERADOR");
  // eslint-disable-next-line no-console
  console.log("");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
