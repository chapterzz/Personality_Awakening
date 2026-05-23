-- CreateTable
CREATE TABLE "sprite_prompt_configs" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "hesitation_lines" JSONB NOT NULL,
    "mutex_lines" JSONB NOT NULL,
    "published_at" TIMESTAMP(3),
    "is_published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sprite_prompt_configs_pkey" PRIMARY KEY ("id")
);
