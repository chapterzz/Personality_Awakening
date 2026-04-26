-- EnableExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- AlterTable
ALTER TABLE "temporary_sessions" RENAME COLUMN "session_id" TO "guest_session_id";

-- AlterTable
ALTER TABLE "temporary_sessions" ADD COLUMN "id" UUID;

-- AlterTable
ALTER TABLE "temporary_sessions" ADD COLUMN "mode" "AssessmentMode";

-- Backfill
UPDATE "temporary_sessions"
SET "id" = gen_random_uuid()
WHERE "id" IS NULL;

-- AlterTable
ALTER TABLE "temporary_sessions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Backfill
UPDATE "temporary_sessions"
SET "mode" = CASE
  WHEN "progress_data"->>'mode' = 'AVG' THEN 'AVG'::"AssessmentMode"
  ELSE 'STANDARD'::"AssessmentMode"
END
WHERE "mode" IS NULL;

-- AlterTable
ALTER TABLE "temporary_sessions" ALTER COLUMN "id" SET NOT NULL;

-- AlterTable
ALTER TABLE "temporary_sessions" ALTER COLUMN "mode" SET NOT NULL;

-- DropIndex
DROP INDEX "temporary_sessions_user_id_key";

-- AlterTable
ALTER TABLE "temporary_sessions" DROP CONSTRAINT "temporary_sessions_pkey";

-- AlterTable
ALTER TABLE "temporary_sessions" ADD CONSTRAINT "temporary_sessions_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "temporary_sessions_user_id_mode_key" ON "temporary_sessions"("user_id", "mode");

-- CreateIndex
CREATE UNIQUE INDEX "temporary_sessions_guest_session_id_mode_key" ON "temporary_sessions"("guest_session_id", "mode");
