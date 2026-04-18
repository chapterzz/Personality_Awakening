-- AlterTable
ALTER TABLE "library_articles" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "temporary_sessions" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "test_classes" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "test_results" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;
