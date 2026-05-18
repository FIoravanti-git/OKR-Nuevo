-- CreateEnum
CREATE TYPE "LandingItemStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "landing_config" (
    "id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "product_name" VARCHAR(128) NOT NULL DEFAULT 'OKR Stack',
    "hero_title" TEXT NOT NULL,
    "hero_subtitle" TEXT NOT NULL,
    "hero_primary_button_text" VARCHAR(128) NOT NULL,
    "hero_primary_button_url" VARCHAR(512) NOT NULL,
    "hero_secondary_button_text" VARCHAR(128),
    "hero_secondary_button_url" VARCHAR(512),
    "show_secondary_button" BOOLEAN NOT NULL DEFAULT true,
    "hero_footnote" TEXT,
    "hero_badge_1" VARCHAR(128),
    "hero_badge_2" VARCHAR(128),
    "logo_url" VARCHAR(512),
    "brand_name" VARCHAR(128) NOT NULL,
    "login_button_text" VARCHAR(64) NOT NULL,
    "show_demo_button" BOOLEAN NOT NULL DEFAULT true,
    "demo_button_text" VARCHAR(64) NOT NULL,
    "demo_button_url" VARCHAR(512) NOT NULL,
    "nav_links_json" JSONB NOT NULL DEFAULT '[]',
    "benefits_eyebrow" VARCHAR(64) NOT NULL,
    "benefits_title" TEXT NOT NULL,
    "benefits_subtitle" TEXT NOT NULL,
    "features_eyebrow" VARCHAR(64) NOT NULL,
    "features_title" TEXT NOT NULL,
    "features_subtitle" TEXT NOT NULL,
    "preview_eyebrow" VARCHAR(64) NOT NULL,
    "preview_title" TEXT NOT NULL,
    "preview_subtitle" TEXT NOT NULL,
    "preview_badge_text" VARCHAR(128),
    "preview_progress_percent" VARCHAR(16) NOT NULL DEFAULT '68%',
    "preview_bars_json" JSONB NOT NULL DEFAULT '[]',
    "preview_stats_json" JSONB NOT NULL DEFAULT '[]',
    "preview_areas_json" JSONB NOT NULL DEFAULT '[]',
    "preview_krs_json" JSONB NOT NULL DEFAULT '[]',
    "preview_activities_json" JSONB NOT NULL DEFAULT '[]',
    "differentiator_eyebrow" VARCHAR(64) NOT NULL,
    "differentiator_title" TEXT NOT NULL,
    "differentiator_subtitle" TEXT NOT NULL,
    "pricing_eyebrow" VARCHAR(64) NOT NULL,
    "pricing_title" TEXT NOT NULL,
    "pricing_subtitle" TEXT NOT NULL,
    "testimonials_eyebrow" VARCHAR(64) NOT NULL,
    "testimonials_title" TEXT NOT NULL,
    "testimonials_subtitle" TEXT,
    "cta_title" TEXT NOT NULL,
    "cta_subtitle" TEXT NOT NULL,
    "cta_button_text" VARCHAR(128) NOT NULL,
    "cta_button_url" VARCHAR(512) NOT NULL,
    "cta_secondary_button_text" VARCHAR(128),
    "cta_secondary_button_url" VARCHAR(512),
    "cta_footnote" TEXT,
    "footer_brand_text" VARCHAR(128) NOT NULL,
    "footer_description" TEXT NOT NULL,
    "contact_email" VARCHAR(255) NOT NULL,
    "contact_whatsapp" VARCHAR(64),
    "copyright_line" TEXT,
    "footer_tagline" TEXT,

    CONSTRAINT "landing_config_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "landing_benefits" (
    "id" TEXT NOT NULL,
    "config_id" VARCHAR(32) NOT NULL DEFAULT 'default',
    "title" VARCHAR(256) NOT NULL,
    "description" TEXT NOT NULL,
    "icon_key" VARCHAR(64) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "LandingItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_benefits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "landing_features" (
    "id" TEXT NOT NULL,
    "config_id" VARCHAR(32) NOT NULL DEFAULT 'default',
    "title" VARCHAR(256) NOT NULL,
    "description" TEXT NOT NULL,
    "icon_key" VARCHAR(64) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "LandingItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_features_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "landing_plans" (
    "id" TEXT NOT NULL,
    "config_id" VARCHAR(32) NOT NULL DEFAULT 'default',
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT NOT NULL,
    "price_label" VARCHAR(64) NOT NULL,
    "period_label" VARCHAR(32),
    "features_json" JSONB NOT NULL DEFAULT '[]',
    "is_highlighted" BOOLEAN NOT NULL DEFAULT false,
    "highlight_label" VARCHAR(64),
    "button_text" VARCHAR(128) NOT NULL,
    "button_url" VARCHAR(512) NOT NULL,
    "show_price" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "LandingItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "landing_testimonials" (
    "id" TEXT NOT NULL,
    "config_id" VARCHAR(32) NOT NULL DEFAULT 'default',
    "name" VARCHAR(128) NOT NULL,
    "role_company" VARCHAR(256) NOT NULL,
    "comment" TEXT NOT NULL,
    "avatar_url" VARCHAR(512),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "LandingItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_testimonials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "landing_differentiator_points" (
    "id" TEXT NOT NULL,
    "config_id" VARCHAR(32) NOT NULL DEFAULT 'default',
    "title" VARCHAR(256) NOT NULL,
    "description" TEXT NOT NULL,
    "icon_key" VARCHAR(64) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "LandingItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_differentiator_points_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "landing_footer_links" (
    "id" TEXT NOT NULL,
    "config_id" VARCHAR(32) NOT NULL DEFAULT 'default',
    "label" VARCHAR(128) NOT NULL,
    "href" VARCHAR(512) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "LandingItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_footer_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "landing_benefits_config_id_sort_order_idx" ON "landing_benefits"("config_id", "sort_order");
CREATE INDEX "landing_features_config_id_sort_order_idx" ON "landing_features"("config_id", "sort_order");
CREATE INDEX "landing_plans_config_id_sort_order_idx" ON "landing_plans"("config_id", "sort_order");
CREATE INDEX "landing_testimonials_config_id_sort_order_idx" ON "landing_testimonials"("config_id", "sort_order");
CREATE INDEX "landing_differentiator_points_config_id_sort_order_idx" ON "landing_differentiator_points"("config_id", "sort_order");
CREATE INDEX "landing_footer_links_config_id_sort_order_idx" ON "landing_footer_links"("config_id", "sort_order");

ALTER TABLE "landing_benefits" ADD CONSTRAINT "landing_benefits_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "landing_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "landing_features" ADD CONSTRAINT "landing_features_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "landing_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "landing_plans" ADD CONSTRAINT "landing_plans_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "landing_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "landing_testimonials" ADD CONSTRAINT "landing_testimonials_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "landing_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "landing_differentiator_points" ADD CONSTRAINT "landing_differentiator_points_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "landing_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "landing_footer_links" ADD CONSTRAINT "landing_footer_links_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "landing_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;
