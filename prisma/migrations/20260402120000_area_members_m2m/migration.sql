-- Tabla puente área ↔ usuario; reemplaza users.area_id y areas.manager_user_id.

CREATE TABLE "area_members" (
    "id" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "es_responsable" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "area_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "area_members_area_id_user_id_key" ON "area_members"("area_id", "user_id");
CREATE INDEX "area_members_area_id_idx" ON "area_members"("area_id");
CREATE INDEX "area_members_user_id_idx" ON "area_members"("user_id");

ALTER TABLE "area_members" ADD CONSTRAINT "area_members_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "area_members" ADD CONSTRAINT "area_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Miembros desde users.area_id
INSERT INTO "area_members" ("id", "area_id", "user_id", "es_responsable", "created_at", "updated_at")
SELECT
    'am_' || REPLACE(gen_random_uuid()::TEXT, '-', ''),
    u."area_id",
    u."id",
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users" u
WHERE u."area_id" IS NOT NULL;

-- Marcar responsables según areas.manager_user_id
UPDATE "area_members" am
SET "es_responsable" = true
FROM "areas" a
WHERE am."area_id" = a."id"
  AND am."user_id" = a."manager_user_id";

-- Responsables huérfanos (manager sin fila en area_members)
INSERT INTO "area_members" ("id", "area_id", "user_id", "es_responsable", "created_at", "updated_at")
SELECT
    'am_' || REPLACE(gen_random_uuid()::TEXT, '-', ''),
    a."id",
    a."manager_user_id",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "areas" a
WHERE a."manager_user_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "area_members" am2
    WHERE am2."area_id" = a."id" AND am2."user_id" = a."manager_user_id"
  );

-- Garantizar al menos un responsable por área que tenga miembros pero ningún responsable
WITH need AS (
    SELECT am."area_id"
    FROM "area_members" am
    GROUP BY am."area_id"
    HAVING BOOL_OR(am."es_responsable") = false
),
pick AS (
    SELECT MIN(am."id") AS "id"
    FROM "area_members" am
    INNER JOIN need ON need."area_id" = am."area_id"
    GROUP BY am."area_id"
)
UPDATE "area_members" am
SET "es_responsable" = true
FROM pick
WHERE am."id" = pick."id";

-- Quitar columnas antiguas
ALTER TABLE "users" DROP CONSTRAINT "users_area_id_fkey";
ALTER TABLE "areas" DROP CONSTRAINT "areas_manager_user_id_fkey";

DROP INDEX IF EXISTS "users_area_id_idx";
DROP INDEX IF EXISTS "areas_manager_user_id_idx";

ALTER TABLE "users" DROP COLUMN "area_id";
ALTER TABLE "areas" DROP COLUMN "manager_user_id";
