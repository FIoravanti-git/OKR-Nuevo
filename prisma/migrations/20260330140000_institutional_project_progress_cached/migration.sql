-- Promedio ponderado cacheado del proyecto (objetivos institucionales).
-- IF NOT EXISTS: compatible si la columna ya se creó con `db push` u otra vía.
ALTER TABLE "institutional_projects" ADD COLUMN IF NOT EXISTS "progress_cached" DECIMAL(6,2);
