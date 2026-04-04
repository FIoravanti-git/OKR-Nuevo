-- Dependencia fin→inicio entre actividades y fecha real de inicio (UTC día).
ALTER TABLE "activities" ADD COLUMN "depends_on_activity_id" TEXT;
ALTER TABLE "activities" ADD COLUMN "actual_start_date" TIMESTAMP(3);

CREATE INDEX "activities_depends_on_activity_id_idx" ON "activities"("depends_on_activity_id");

ALTER TABLE "activities" ADD CONSTRAINT "activities_depends_on_activity_id_fkey" FOREIGN KEY ("depends_on_activity_id") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
