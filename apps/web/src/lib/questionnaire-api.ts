/**
 * 浏览器端调用 Nest `/questionnaire` API：获取问卷结构与随机 48 题题序。
 */
import { getBrowserApiBaseUrl } from './api-base';

/** 服务端返回的选项结构 */
export type ApiQuestionnaireOption = {
  id: string;
  label: string;
  valueKey: string;
  dimension: string | null;
  side: string | null;
  weight: number | null;
};

/** 服务端返回的题目结构 */
export type ApiQuestionnaireQuestion = {
  id: string;
  prompt: string;
  dimension: string | null;
  groupTag: string | null;
  options: ApiQuestionnaireOption[];
};

/** 服务端返回的问卷结构 */
export type ApiQuestionnaireData = {
  id: string;
  title: string;
  questions: ApiQuestionnaireQuestion[];
};

/** 题序响应 */
export type ApiSequenceData = {
  questionnaire_id: string;
  ordered_question_ids: string[];
};

export type SequenceStrategy = 'shuffle' | 'reuse';

export type FetchQuestionSequenceOptions = {
  strategy?: SequenceStrategy;
  previousOrderedQuestionIds?: string[];
};

export class QuestionnaireApiError extends Error {
  readonly name = 'QuestionnaireApiError';
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * 获取已发布问卷的完整结构（题目 + 选项）。
 */
export async function fetchQuestionnaire(id: string): Promise<ApiQuestionnaireData> {
  const base = getBrowserApiBaseUrl();
  const response = await fetch(
    `${base.replace(/\/$/, '')}/questionnaire/${encodeURIComponent(id)}`,
    {
      credentials: 'omit',
    },
  );

  const text = await response.text();
  const body = text ? (JSON.parse(text) as unknown) : null;
  if (!response.ok) {
    throw new QuestionnaireApiError('questionnaire_fetch_failed', response.status);
  }
  if (!isRecord(body) || body.success !== true || !isRecord(body.data)) {
    throw new QuestionnaireApiError('questionnaire_response_invalid', response.status);
  }

  return body.data as ApiQuestionnaireData;
}

/**
 * 生成随机 48 题题序。strategy=reuse 时传入上次 ordered_question_ids。
 */
export async function fetchQuestionSequence(
  id: string,
  options?: FetchQuestionSequenceOptions,
): Promise<ApiSequenceData> {
  const base = getBrowserApiBaseUrl();
  const payload: Record<string, unknown> = {};
  if (options?.strategy) {
    payload.strategy = options.strategy;
  }
  if (options?.previousOrderedQuestionIds) {
    payload.previous_ordered_question_ids = options.previousOrderedQuestionIds;
  }

  const response = await fetch(
    `${base.replace(/\/$/, '')}/questionnaire/${encodeURIComponent(id)}/sequence`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'omit',
    },
  );

  const text = await response.text();
  const body = text ? (JSON.parse(text) as unknown) : null;
  if (!response.ok) {
    throw new QuestionnaireApiError('sequence_fetch_failed', response.status);
  }
  if (!isRecord(body) || body.success !== true || !isRecord(body.data)) {
    throw new QuestionnaireApiError('sequence_response_invalid', response.status);
  }

  return body.data as ApiSequenceData;
}
