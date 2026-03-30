-- Tipos de métrica y modo de cálculo del progreso del resultado clave.
CREATE TYPE "KeyResultMetricType" AS ENUM ('NUMBER', 'PERCENT', 'CURRENCY', 'COUNT', 'CUSTOM');
CREATE TYPE "KeyResultCalculationMode" AS ENUM ('MANUAL', 'AUTOMATIC', 'HYBRID');

ALTER TABLE "key_results" ADD COLUMN "initial_value" DECIMAL(14,4);
ALTER TABLE "key_results" ADD COLUMN "metric_type" "KeyResultMetricType" NOT NULL DEFAULT 'NUMBER';
ALTER TABLE "key_results" ADD COLUMN "calculation_mode" "KeyResultCalculationMode" NOT NULL DEFAULT 'AUTOMATIC';
ALTER TABLE "key_results" ADD COLUMN "allow_activity_impact" BOOLEAN NOT NULL DEFAULT true;
