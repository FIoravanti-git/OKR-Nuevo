-- Historial de avances para resultados clave (trazabilidad).
-- KeyResultStatus se define también en okr_platform_v2 (migración posterior); aquí hace falta en shadow DB porque esta migración corre antes.
DO $$ BEGIN
    CREATE TYPE "KeyResultStatus" AS ENUM ('DRAFT', 'ON_TRACK', 'AT_RISK', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TYPE "KeyResultProgressLogSource" AS ENUM ('FORM_SAVE', 'STATUS_CHANGE', 'RECALCULATE');

CREATE TABLE "key_result_progress_logs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "key_result_id" TEXT NOT NULL,
    "source" "KeyResultProgressLogSource" NOT NULL,
    "previous_progress" DECIMAL(6,2),
    "new_progress" DECIMAL(6,2),
    "previous_current_value" DECIMAL(14,4),
    "new_current_value" DECIMAL(14,4),
    "previous_status" "KeyResultStatus",
    "new_status" "KeyResultStatus",
    "note" TEXT,
    "changed_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "key_result_progress_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "key_result_progress_logs_company_id_key_result_id_idx" ON "key_result_progress_logs"("company_id", "key_result_id");
CREATE INDEX "key_result_progress_logs_key_result_id_created_at_idx" ON "key_result_progress_logs"("key_result_id", "created_at");
CREATE INDEX "key_result_progress_logs_company_id_created_at_idx" ON "key_result_progress_logs"("company_id", "created_at");

ALTER TABLE "key_result_progress_logs" ADD CONSTRAINT "key_result_progress_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "key_result_progress_logs" ADD CONSTRAINT "key_result_progress_logs_key_result_id_fkey" FOREIGN KEY ("key_result_id") REFERENCES "key_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "key_result_progress_logs" ADD CONSTRAINT "key_result_progress_logs_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
