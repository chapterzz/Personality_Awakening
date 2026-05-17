-- AlterTable
ALTER TABLE "library_articles" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'theory',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "library_articles_is_published_category_idx" ON "library_articles"("is_published", "category");
