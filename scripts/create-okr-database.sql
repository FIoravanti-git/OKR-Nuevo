-- =============================================================================
-- OKR Stack — script de creación de esquema (PostgreSQL)
-- =============================================================================
-- Uso típico (base vacía):
--   psql "postgresql://USUARIO:CLAVE@localhost:5433/OKR" -f scripts/create-okr-database.sql
--
-- Equivale al modelo Prisma en prisma/schema.prisma. En el día a día se recomienda:
--   npx prisma migrate deploy
--
-- Convenciones:
--   • Tablas en snake_case; columnas created_at / updated_at (salvo logs append-only).
--   • company_id en filas de negocio para filtrado por tenant y futuro RLS/particionado.
-- =============================================================================

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN_EMPRESA', 'OPERADOR');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InstitutionalProjectStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InstitutionalObjectiveStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StrategicObjectiveStatus" AS ENUM ('DRAFT', 'ACTIVE', 'AT_RISK', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "KeyResultStatus" AS ENUM ('DRAFT', 'ON_TRACK', 'AT_RISK', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProgressCalculationMode" AS ENUM ('WEIGHTED_AVERAGE', 'SUM_NORMALIZED', 'MAX_OF_CHILDREN', 'MIN_OF_CHILDREN', 'MANUAL_OVERRIDE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPERSONATE', 'OTHER');

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "max_users" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "max_users" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_subscriptions" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "external_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "company_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institutional_projects" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "mission" TEXT,
    "vision" TEXT,
    "status" "InstitutionalProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutional_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institutional_objectives" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "institutional_project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "weight" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "InstitutionalObjectiveStatus" NOT NULL DEFAULT 'DRAFT',
    "progress_cached" DECIMAL(6,2),
    "progress_mode" "ProgressCalculationMode" NOT NULL DEFAULT 'WEIGHTED_AVERAGE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutional_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategic_objectives" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "institutional_objective_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "weight" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "StrategicObjectiveStatus" NOT NULL DEFAULT 'DRAFT',
    "progress_cached" DECIMAL(6,2),
    "progress_mode" "ProgressCalculationMode" NOT NULL DEFAULT 'WEIGHTED_AVERAGE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategic_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "key_results" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "strategic_objective_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "weight" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "target_value" DECIMAL(14,4),
    "current_value" DECIMAL(14,4),
    "unit" TEXT,
    "progress_cached" DECIMAL(6,2),
    "status" "KeyResultStatus" NOT NULL DEFAULT 'DRAFT',
    "progress_mode" "ProgressCalculationMode" NOT NULL DEFAULT 'WEIGHTED_AVERAGE',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "key_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "key_result_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "impacts_progress" BOOLEAN NOT NULL DEFAULT true,
    "contribution_weight" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "progress_contribution" DECIMAL(6,2),
    "status" "ActivityStatus" NOT NULL DEFAULT 'PLANNED',
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_progress_logs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "previous_progress" DECIMAL(6,2),
    "new_progress" DECIMAL(6,2),
    "previous_status" "ActivityStatus",
    "new_status" "ActivityStatus",
    "note" TEXT,
    "changed_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_progress_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT,
    "actor_user_id" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE INDEX "company_subscriptions_company_id_status_idx" ON "company_subscriptions"("company_id", "status");

-- CreateIndex
CREATE INDEX "company_subscriptions_plan_id_idx" ON "company_subscriptions"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "institutional_projects_company_id_key" ON "institutional_projects"("company_id");

-- CreateIndex
CREATE INDEX "institutional_projects_company_id_idx" ON "institutional_projects"("company_id");

-- CreateIndex
CREATE INDEX "institutional_objectives_company_id_idx" ON "institutional_objectives"("company_id");

-- CreateIndex
CREATE INDEX "institutional_objectives_institutional_project_id_idx" ON "institutional_objectives"("institutional_project_id");

-- CreateIndex
CREATE INDEX "institutional_objectives_company_id_institutional_project_i_idx" ON "institutional_objectives"("company_id", "institutional_project_id");

-- CreateIndex
CREATE INDEX "strategic_objectives_company_id_idx" ON "strategic_objectives"("company_id");

-- CreateIndex
CREATE INDEX "strategic_objectives_institutional_objective_id_idx" ON "strategic_objectives"("institutional_objective_id");

-- CreateIndex
CREATE INDEX "strategic_objectives_company_id_institutional_objective_id_idx" ON "strategic_objectives"("company_id", "institutional_objective_id");

-- CreateIndex
CREATE INDEX "key_results_company_id_idx" ON "key_results"("company_id");

-- CreateIndex
CREATE INDEX "key_results_strategic_objective_id_idx" ON "key_results"("strategic_objective_id");

-- CreateIndex
CREATE INDEX "key_results_company_id_strategic_objective_id_idx" ON "key_results"("company_id", "strategic_objective_id");

-- CreateIndex
CREATE INDEX "activities_company_id_idx" ON "activities"("company_id");

-- CreateIndex
CREATE INDEX "activities_key_result_id_idx" ON "activities"("key_result_id");

-- CreateIndex
CREATE INDEX "activities_company_id_key_result_id_idx" ON "activities"("company_id", "key_result_id");

-- CreateIndex
CREATE INDEX "activity_progress_logs_company_id_activity_id_idx" ON "activity_progress_logs"("company_id", "activity_id");

-- CreateIndex
CREATE INDEX "activity_progress_logs_activity_id_created_at_idx" ON "activity_progress_logs"("activity_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_progress_logs_company_id_created_at_idx" ON "activity_progress_logs"("company_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_created_at_idx" ON "audit_logs"("company_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "company_subscriptions" ADD CONSTRAINT "company_subscriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_subscriptions" ADD CONSTRAINT "company_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institutional_projects" ADD CONSTRAINT "institutional_projects_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institutional_objectives" ADD CONSTRAINT "institutional_objectives_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institutional_objectives" ADD CONSTRAINT "institutional_objectives_institutional_project_id_fkey" FOREIGN KEY ("institutional_project_id") REFERENCES "institutional_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_objectives" ADD CONSTRAINT "strategic_objectives_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_objectives" ADD CONSTRAINT "strategic_objectives_institutional_objective_id_fkey" FOREIGN KEY ("institutional_objective_id") REFERENCES "institutional_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_results" ADD CONSTRAINT "key_results_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_results" ADD CONSTRAINT "key_results_strategic_objective_id_fkey" FOREIGN KEY ("strategic_objective_id") REFERENCES "strategic_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_key_result_id_fkey" FOREIGN KEY ("key_result_id") REFERENCES "key_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_progress_logs" ADD CONSTRAINT "activity_progress_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_progress_logs" ADD CONSTRAINT "activity_progress_logs_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_progress_logs" ADD CONSTRAINT "activity_progress_logs_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
