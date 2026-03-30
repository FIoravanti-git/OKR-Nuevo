-- DropUniqueIndex
DROP INDEX IF EXISTS "institutional_projects_company_id_key";

-- AlterTable
ALTER TABLE "institutional_projects" ADD COLUMN "year" INTEGER,
ADD COLUMN "methodology" VARCHAR(256);
