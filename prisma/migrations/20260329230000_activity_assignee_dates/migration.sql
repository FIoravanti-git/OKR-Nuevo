-- Responsable y fecha de inicio en actividades.
ALTER TABLE "activities" ADD COLUMN "assignee_user_id" TEXT;
ALTER TABLE "activities" ADD COLUMN "start_date" TIMESTAMP(3);

ALTER TABLE "activities" ADD CONSTRAINT "activities_assignee_user_id_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "activities_assignee_user_id_idx" ON "activities"("assignee_user_id");
CREATE INDEX "activities_company_id_assignee_user_id_idx" ON "activities"("company_id", "assignee_user_id");
