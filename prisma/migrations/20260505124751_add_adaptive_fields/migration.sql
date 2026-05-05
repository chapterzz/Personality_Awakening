-- AlterTable
ALTER TABLE "standard_question_options" ADD COLUMN     "dimension" TEXT,
ADD COLUMN     "side" TEXT,
ADD COLUMN     "weight" INTEGER;

-- AlterTable
ALTER TABLE "standard_questions" ADD COLUMN     "dimension" TEXT,
ADD COLUMN     "group_sort_order" INTEGER,
ADD COLUMN     "group_tag" TEXT;

-- AlterTable
ALTER TABLE "temporary_sessions" ALTER COLUMN "id" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "standard_questions_questionnaire_id_group_tag_idx" ON "standard_questions"("questionnaire_id", "group_tag");
