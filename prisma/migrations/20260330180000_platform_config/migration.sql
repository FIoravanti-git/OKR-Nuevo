-- Configuración global (singleton)
CREATE TABLE "platform_config" (
    "id" VARCHAR(32) NOT NULL,
    "display_name" VARCHAR(128) NOT NULL,
    "support_email" VARCHAR(255),
    "notice_banner" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_config_pkey" PRIMARY KEY ("id")
);
