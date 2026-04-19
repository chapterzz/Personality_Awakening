/**
 * PRD §2.4 `progress_data` 前端类型与构造（schema_version = 1，snake_case，与后端校验一致）。
 */

export type ProgressMode = 'STANDARD' | 'AVG';

export type StandardProgressBranch = {
  current_index: number;
  answers: Record<string, string | number>;
  ordered_question_ids?: string[];
  answered_count?: number;
};

export type ProgressMeta = {
  started_at?: string;
  last_client?: string;
};

/** 标准模式进行中快照（顶层须含 schema_version / mode / standard） */
export type StandardProgressDataV1 = {
  schema_version: 1;
  mode: 'STANDARD';
  questionnaire_id?: string;
  standard: StandardProgressBranch;
  meta?: ProgressMeta;
};

export function createInitialStandardProgress(
  orderedQuestionIds: string[],
  questionnaireId: string,
): StandardProgressDataV1 {
  return {
    schema_version: 1,
    mode: 'STANDARD',
    questionnaire_id: questionnaireId,
    standard: {
      current_index: 0,
      answers: {},
      ordered_question_ids: orderedQuestionIds,
      answered_count: 0,
    },
    meta: {
      started_at: new Date().toISOString(),
      last_client: 'web',
    },
  };
}

/**
 * 写入答案并推进题号（同一题改选不推进）；`answered_count` 与 `answers` 键数量一致（后端校验）。
 */
export function applyStandardAnswer(
  data: StandardProgressDataV1,
  questionId: string,
  optionId: string | number,
): StandardProgressDataV1 {
  const prev = data.standard.answers[questionId];
  const answers = { ...data.standard.answers, [questionId]: optionId };
  const answeredCount = Object.keys(answers).length;
  const ordered = data.standard.ordered_question_ids ?? [];
  const wasNew = prev === undefined;
  const nextIndex = wasNew
    ? Math.min(data.standard.current_index + 1, ordered.length)
    : data.standard.current_index;
  return {
    ...data,
    standard: {
      ...data.standard,
      answers,
      answered_count: answeredCount,
      current_index: nextIndex,
    },
  };
}

/**
 * 是否触发「每 5 题」自动保存；最后一题答完时也须保存（PRD：至少每 5 题 + 完成态）。
 */
export function shouldTriggerStandardAutosave(
  answeredCount: number,
  totalQuestions: number,
): boolean {
  if (answeredCount <= 0) return false;
  if (answeredCount === totalQuestions) return true;
  return answeredCount % 5 === 0;
}
