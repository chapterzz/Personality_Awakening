/**
 * 随机题序纯函数：分层抽样、Fisher-Yates 洗牌、reuse 校验。
 * 供 QuestionnaireService 调用；注入 rng 便于单测确定性断言。
 */
import { BadRequestException } from '@nestjs/common';
import { randomInt } from 'crypto';

export const PRESENTED_COUNT = 48;
export const PER_DIMENSION_COUNT = 12;
export const DIMENSIONS = ['EI', 'SN', 'TF', 'JP'] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export type QuestionRef = { id: string; dimension: string | null };

/** 返回 [0, 1) 区间的随机数 */
export type Rng = () => number;

/**
 * 默认随机源：crypto.randomInt。
 */
export function defaultRng(): number {
  return randomInt(0, 1_000_000) / 1_000_000;
}

/**
 * 将题目按 dimension 分组；无维度或未知维度的题目忽略。
 */
export function groupQuestionsByDimension(
  questions: QuestionRef[],
): Record<Dimension, QuestionRef[]> {
  const grouped = Object.fromEntries(DIMENSIONS.map((d) => [d, [] as QuestionRef[]])) as Record<
    Dimension,
    QuestionRef[]
  >;
  for (const q of questions) {
    if (q.dimension && DIMENSIONS.includes(q.dimension as Dimension)) {
      grouped[q.dimension as Dimension].push(q);
    }
  }
  return grouped;
}

/**
 * 校验各维度题池是否满足 PER_DIMENSION_COUNT；不足则抛 400。
 */
export function validateDimensionPools(grouped: Record<Dimension, QuestionRef[]>): void {
  for (const dim of DIMENSIONS) {
    const available = grouped[dim].length;
    if (available < PER_DIMENSION_COUNT) {
      throw new BadRequestException({
        success: false,
        message: 'insufficient_questions',
        data: { dimension: dim, required: PER_DIMENSION_COUNT, available },
      });
    }
  }
}

/**
 * Fisher-Yates 原地洗牌。
 */
export function shuffleArray<T>(arr: T[], rng: Rng): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 每维度无放回随机抽 PER_DIMENSION_COUNT 题，合并后全局洗牌。
 */
export function pickStratifiedRandomIds(
  grouped: Record<Dimension, QuestionRef[]>,
  rng: Rng = defaultRng,
): string[] {
  const picked: string[] = [];
  for (const dim of DIMENSIONS) {
    const pool = shuffleArray([...grouped[dim]], rng);
    picked.push(...pool.slice(0, PER_DIMENSION_COUNT).map((q) => q.id));
  }
  return shuffleArray(picked, rng);
}

/**
 * 校验 reuse 题序合法：长度 48、ID 存在、每维度 12 题；通过则原样返回。
 */
export function validateReuseIds(
  previousIds: string[],
  allQuestions: QuestionRef[],
  grouped: Record<Dimension, QuestionRef[]>,
): string[] {
  if (previousIds.length !== PRESENTED_COUNT) {
    throw new BadRequestException({
      success: false,
      message: 'invalid_reuse_sequence',
      data: { reason: 'wrong_length', expected: PRESENTED_COUNT, actual: previousIds.length },
    });
  }

  const idSet = new Set(allQuestions.map((q) => q.id));
  for (const id of previousIds) {
    if (!idSet.has(id)) {
      throw new BadRequestException({
        success: false,
        message: 'invalid_reuse_sequence',
        data: { reason: 'unknown_question_id', question_id: id },
      });
    }
  }

  validateDimensionPools(grouped);

  const dimCounts = Object.fromEntries(DIMENSIONS.map((d) => [d, 0])) as Record<Dimension, number>;
  const dimById = new Map(allQuestions.map((q) => [q.id, q.dimension]));
  for (const id of previousIds) {
    const dim = dimById.get(id);
    if (dim && DIMENSIONS.includes(dim as Dimension)) {
      dimCounts[dim as Dimension]++;
    }
  }
  for (const dim of DIMENSIONS) {
    if (dimCounts[dim] !== PER_DIMENSION_COUNT) {
      throw new BadRequestException({
        success: false,
        message: 'invalid_reuse_sequence',
        data: { reason: 'dimension_imbalance', dimension: dim, count: dimCounts[dim] },
      });
    }
  }

  return previousIds;
}
