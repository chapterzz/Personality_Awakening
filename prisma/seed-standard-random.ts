/**
 * standard-v1 随机 48 题演示题库 Seed：96 题（每维度 24 题）。
 * 由 prisma/seed.ts 调用。
 */
import { PrismaClient } from '@prisma/client';

export const STANDARD_RANDOM_QUESTIONNAIRE_ID = 'standard-v1';
const STANDARD_RANDOM_QUESTIONNAIRE_TITLE = '标准 MBTI 随机题库';

const DIMENSIONS = ['EI', 'SN', 'TF', 'JP'] as const;
const QUESTIONS_PER_DIMENSION = 24;

type SeedQuestion = {
  id: string;
  prompt: string;
  sortOrder: number;
  dimension: string;
  groupTag: null;
  groupSortOrder: null;
  options: Array<{
    id: string;
    label: string;
    valueKey: string;
    dimension: string;
    side: string;
    weight: number;
  }>;
};

/**
 * 程序化构建 96 题演示题库。
 */
export function buildStandardRandomQuestions(): SeedQuestion[] {
  const questions: SeedQuestion[] = [];
  let sortOrder = 1;
  for (const dim of DIMENSIONS) {
    for (let i = 1; i <= QUESTIONS_PER_DIMENSION; i++) {
      const id = `sr-${dim.toLowerCase()}-${String(i).padStart(2, '0')}`;
      questions.push({
        id,
        prompt: `[${dim}] 演示题目 ${i}`,
        sortOrder: sortOrder++,
        dimension: dim,
        groupTag: null,
        groupSortOrder: null,
        options: [
          {
            id: `${id}_A`,
            label: '选项 A',
            valueKey: `${id}_A`,
            dimension: dim,
            side: dim[0],
            weight: 2,
          },
          {
            id: `${id}_B`,
            label: '选项 B',
            valueKey: `${id}_B`,
            dimension: dim,
            side: dim[1],
            weight: 2,
          },
        ],
      });
    }
  }
  return questions;
}

/**
 * Upsert standard-v1 问卷及 96 题。
 */
export async function seedStandardRandomQuestionnaire(prisma: PrismaClient): Promise<void> {
  const questions = buildStandardRandomQuestions();

  await prisma.standardQuestionnaire.upsert({
    where: { id: STANDARD_RANDOM_QUESTIONNAIRE_ID },
    update: {
      title: STANDARD_RANDOM_QUESTIONNAIRE_TITLE,
      isPublished: true,
      publishedAt: new Date(),
    },
    create: {
      id: STANDARD_RANDOM_QUESTIONNAIRE_ID,
      title: STANDARD_RANDOM_QUESTIONNAIRE_TITLE,
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  const existingQuestions = await prisma.standardQuestion.findMany({
    where: { questionnaireId: STANDARD_RANDOM_QUESTIONNAIRE_ID },
    select: { id: true },
  });
  const existingIds = existingQuestions.map((q) => q.id);
  const newIds = questions.map((q) => q.id);
  const toDelete = existingIds.filter((id) => !newIds.includes(id));

  if (toDelete.length > 0) {
    await prisma.standardQuestionOption.deleteMany({ where: { questionId: { in: toDelete } } });
    await prisma.standardQuestion.deleteMany({ where: { id: { in: toDelete } } });
  }

  for (const q of questions) {
    await prisma.standardQuestion.upsert({
      where: { id: q.id },
      update: {
        prompt: q.prompt,
        sortOrder: q.sortOrder,
        dimension: q.dimension,
        groupTag: q.groupTag,
        groupSortOrder: q.groupSortOrder,
      },
      create: {
        id: q.id,
        questionnaireId: STANDARD_RANDOM_QUESTIONNAIRE_ID,
        prompt: q.prompt,
        sortOrder: q.sortOrder,
        dimension: q.dimension,
        groupTag: q.groupTag,
        groupSortOrder: q.groupSortOrder,
      },
    });

    for (const opt of q.options) {
      await prisma.standardQuestionOption.upsert({
        where: { id: opt.id },
        update: {
          label: opt.label,
          valueKey: opt.valueKey,
          dimension: opt.dimension,
          side: opt.side,
          weight: opt.weight,
        },
        create: {
          id: opt.id,
          questionId: q.id,
          label: opt.label,
          valueKey: opt.valueKey,
          dimension: opt.dimension,
          side: opt.side,
          weight: opt.weight,
        },
      });
    }
  }

  console.log(
    `Seeded questionnaire "${STANDARD_RANDOM_QUESTIONNAIRE_ID}" with ${questions.length} questions.`,
  );
}
