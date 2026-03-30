-- Add enum for key result target direction.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'KeyResultTargetDirection') THEN
    CREATE TYPE "KeyResultTargetDirection" AS ENUM ('ASCENDENTE', 'DESCENDENTE');
  END IF;
END
$$;

-- Add column with safe default for existing rows.
ALTER TABLE "key_results"
ADD COLUMN IF NOT EXISTS "target_direction" "KeyResultTargetDirection" NOT NULL DEFAULT 'ASCENDENTE';
