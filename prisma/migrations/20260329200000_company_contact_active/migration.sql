-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "ruc" VARCHAR(32),
ADD COLUMN     "email" VARCHAR(255),
ADD COLUMN     "phone" VARCHAR(64),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;
