/**
 * 题库 CMS 共享校验：选项计分三元组、T2.7 题组字段、发布前完整性检查。
 */

/** MBTI 四维度标签 */
export const VALID_DIMENSIONS = ['EI', 'SN', 'TF', 'JP'] as const;
export type ValidDimension = (typeof VALID_DIMENSIONS)[number];

/** T2.7 题组标识（与 seed / QuestionnaireService 一致） */
export const VALID_GROUP_TAGS = [
  'screening',
  'ei_followup',
  'sn_followup',
  'tf_followup',
  'jp_followup',
] as const;

const DIMENSION_SIDES = {
  EI: ['E', 'I'],
  SN: ['S', 'N'],
  TF: ['T', 'F'],
  JP: ['J', 'P'],
} as const;

/** 校验失败时抛出，携带 machine-readable code */
export class QuestionnaireValidationError extends Error {
  readonly name = 'QuestionnaireValidationError';

  constructor(readonly code: string) {
    super(code);
  }
}

/**
 * 校验选项计分字段：dimension 非空时 side/weight 须完整且合法。
 */
export function validateOptionScoring(input: {
  dimension: string | null;
  side: string | null;
  weight: number | null;
}): void {
  if (!input.dimension) {
    return;
  }
  const sides = DIMENSION_SIDES[input.dimension as keyof typeof DIMENSION_SIDES];
  if (!sides) {
    throw new QuestionnaireValidationError('invalid_dimension');
  }
  if (!input.side || !(sides as readonly string[]).includes(input.side)) {
    throw new QuestionnaireValidationError('invalid_side');
  }
  if (input.weight == null || input.weight < 1 || input.weight > 3) {
    throw new QuestionnaireValidationError('invalid_weight');
  }
}

/**
 * 校验题目 T2.7 分组字段：groupTag / dimension 须在约定枚举内。
 */
export function validateQuestionGroupFields(input: {
  dimension: string | null;
  groupTag: string | null;
}): void {
  if (input.dimension && !VALID_DIMENSIONS.includes(input.dimension as ValidDimension)) {
    throw new QuestionnaireValidationError('invalid_dimension');
  }
  if (
    input.groupTag &&
    !VALID_GROUP_TAGS.includes(input.groupTag as (typeof VALID_GROUP_TAGS)[number])
  ) {
    throw new QuestionnaireValidationError('invalid_group_tag');
  }
}

type PublishQuestion = {
  groupTag: string | null;
  options: Array<{
    dimension: string | null;
    side: string | null;
    weight: number | null;
  }>;
};

/**
 * 发布前校验：至少 1 道 screening 题；每题 ≥2 选项；计分选项须完整三元组。
 */
export function validateQuestionnaireForPublish(questions: PublishQuestion[]): void {
  if (questions.length === 0) {
    throw new QuestionnaireValidationError('no_questions');
  }

  const hasScreening = questions.some((q) => q.groupTag === 'screening');
  if (!hasScreening) {
    throw new QuestionnaireValidationError('missing_screening');
  }

  for (const q of questions) {
    if (q.options.length < 2) {
      throw new QuestionnaireValidationError('question_needs_two_options');
    }
    for (const opt of q.options) {
      validateOptionScoring(opt);
    }
  }
}
