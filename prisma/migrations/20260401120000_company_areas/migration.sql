-- CreateEnum


-- CreateTable
CREATE TABLE "areas" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "manager_user_id" TEXT,
    "status" "AreaStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "users" ADD COLUMN "area_id" TEXT;

-- AlterTable
ALTER TABLE "strategic_objectives" ADD COLUMN "area_id" TEXT;

-- AlterTable
ALTER TABLE "key_results" ADD COLUMN "area_id" TEXT;

-- CreateIndex
CREATE INDEX "areas_company_id_idx" ON "areas"("company_id");

-- CreateIndex
CREATE INDEX "areas_manager_user_id_idx" ON "areas"("manager_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "areas_company_id_name_key" ON "areas"("company_id", "name");

-- CreateIndex
CREATE INDEX "users_area_id_idx" ON "users"("area_id");

-- CreateIndex
CREATE INDEX "strategic_objectives_area_id_idx" ON "strategic_objectives"("area_id");

-- CreateIndex
CREATE INDEX "key_results_area_id_idx" ON "key_results"("area_id");

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "areas_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "areas_manager_user_id_fkey" FOREIGN KEY ("manager_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_objectives" ADD CONSTRAINT "strategic_objectives_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_results" ADD CONSTRAINT "key_results_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
