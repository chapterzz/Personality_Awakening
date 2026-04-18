-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AssessmentMode" AS ENUM ('STANDARD', 'AVG');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nickname" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_classes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "invite_code" TEXT NOT NULL,
    "teacher_id" UUID NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "test_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_class_relations" (
    "user_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_class_relations_pkey" PRIMARY KEY ("user_id","class_id")
);

-- CreateTable
CREATE TABLE "test_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "mode" "AssessmentMode" NOT NULL,
    "scores" JSONB NOT NULL,
    "type" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temporary_sessions" (
    "session_id" TEXT NOT NULL,
    "user_id" UUID,
    "progress_data" JSONB NOT NULL,
    "progress_revision" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temporary_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "standard_questionnaires" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "is_published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "standard_questionnaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standard_questions" (
    "id" TEXT NOT NULL,
    "questionnaire_id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "standard_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standard_question_options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value_key" TEXT NOT NULL,

    CONSTRAINT "standard_question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avg_scripts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "nodes_json" JSONB NOT NULL,
    "published_at" TIMESTAMP(3),
    "is_published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "avg_scripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_articles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "body_md" TEXT NOT NULL,
    "excerpt" TEXT,
    "published_at" TIMESTAMP(3),
    "is_published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "library_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "test_classes_invite_code_key" ON "test_classes"("invite_code");

-- CreateIndex
CREATE INDEX "test_classes_teacher_id_idx" ON "test_classes"("teacher_id");

-- CreateIndex
CREATE INDEX "test_results_user_id_idx" ON "test_results"("user_id");

-- CreateIndex
CREATE INDEX "temporary_sessions_expires_at_idx" ON "temporary_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "temporary_sessions_user_id_key" ON "temporary_sessions"("user_id");

-- CreateIndex
CREATE INDEX "standard_questions_questionnaire_id_idx" ON "standard_questions"("questionnaire_id");

-- CreateIndex
CREATE INDEX "standard_question_options_question_id_idx" ON "standard_question_options"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "library_articles_slug_key" ON "library_articles"("slug");

-- AddForeignKey
ALTER TABLE "test_classes" ADD CONSTRAINT "test_classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_class_relations" ADD CONSTRAINT "user_class_relations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_class_relations" ADD CONSTRAINT "user_class_relations_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "test_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_sessions" ADD CONSTRAINT "temporary_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standard_questions" ADD CONSTRAINT "standard_questions_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "standard_questionnaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standard_question_options" ADD CONSTRAINT "standard_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "standard_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
