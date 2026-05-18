-- CreateTable
CREATE TABLE "app_branding" (
    "id" VARCHAR(32) NOT NULL,
    "app_name" VARCHAR(128) NOT NULL DEFAULT 'OKR Stack',
    "logo_url" VARCHAR(512),
    "logo_alt" VARCHAR(256),
    "favicon_url" VARCHAR(512),
    "primary_color" VARCHAR(32) NOT NULL DEFAULT '#334155',
    "secondary_color" VARCHAR(32) NOT NULL DEFAULT '#64748b',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_branding_pkey" PRIMARY KEY ("id")
);
