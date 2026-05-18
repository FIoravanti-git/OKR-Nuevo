/**
 * Carga la configuración inicial de la landing (singleton + listas).
 * Idempotente: si ya existe la fila `default`, no hace nada.
 *
 * Uso: npx tsx prisma/seed-landing-config.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma";
import { LANDING_CONFIG_ROW_ID } from "../src/lib/landing-config/constants";
import { getDefaultLandingConfigScalars, getDefaultLandingPageConfig } from "../src/lib/landing-config/defaults";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL es obligatoria");
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const existing = await prisma.landingConfig.findUnique({
    where: { id: LANDING_CONFIG_ROW_ID },
    select: { id: true },
  });

  if (existing) {
    console.log("Landing config ya existe (id=default). Sin cambios.");
    return;
  }

  const defaults = getDefaultLandingPageConfig();
  const scalars = getDefaultLandingConfigScalars();

  await prisma.landingConfig.create({
    data: {
      id: LANDING_CONFIG_ROW_ID,
      ...scalars,
      benefits: {
        create: defaults.benefits.items.map((b) => ({
          title: b.title,
          description: b.description,
          iconKey: b.iconKey,
          sortOrder: b.sortOrder,
          status: b.status,
        })),
      },
      features: {
        create: defaults.features.items.map((f) => ({
          title: f.title,
          description: f.description,
          iconKey: f.iconKey,
          sortOrder: f.sortOrder,
          status: f.status,
        })),
      },
      differentiatorPoints: {
        create: defaults.differentiator.points.map((p) => ({
          title: p.title,
          description: p.description,
          iconKey: p.iconKey,
          sortOrder: p.sortOrder,
          status: p.status,
        })),
      },
      plans: {
        create: defaults.pricing.plans.map((p) => ({
          name: p.name,
          description: p.description,
          priceLabel: p.priceLabel,
          periodLabel: p.periodLabel,
          featuresJson: p.features,
          isHighlighted: p.isHighlighted,
          highlightLabel: p.highlightLabel,
          buttonText: p.buttonText,
          buttonUrl: p.buttonUrl,
          showPrice: p.showPrice,
          sortOrder: p.sortOrder,
          status: p.status,
        })),
      },
      testimonials: {
        create: defaults.testimonials.items.map((t) => ({
          name: t.name,
          roleCompany: t.roleCompany,
          comment: t.comment,
          avatarUrl: t.avatarUrl,
          sortOrder: t.sortOrder,
          status: t.status,
        })),
      },
      footerLinks: {
        create: defaults.footer.links.map((l) => ({
          label: l.label,
          href: l.href,
          sortOrder: l.sortOrder,
          status: l.status,
        })),
      },
    },
  });

  console.log("Landing config creada con valores por defecto.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
