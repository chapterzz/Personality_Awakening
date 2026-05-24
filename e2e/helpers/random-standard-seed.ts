/**
 * E2E 辅助：为 standard-v1 生成「标准模式已完成」的游客进度快照。
 * 通过真实 sequence API 获取 48 题题序。
 */
import type { APIRequestContext } from '@playwright/test';

export const STANDARD_QUESTIONNAIRE_ID = 'standard-v1';
export const EXPECTED_PRESENTED_COUNT = 48;

const API_BASE = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3001';

export type SequenceRequest = {
  strategy?: 'shuffle' | 'reuse';
  previous_ordered_question_ids?: string[];
};

/** 调用 POST /questionnaire/:id/sequence 获取题序 */
export async function fetchRandomOrderedIds(
  request: APIRequestContext,
  options: SequenceRequest = { strategy: 'shuffle' },
): Promise<string[]> {
  const res = await request.post(
    `${API_BASE}/questionnaire/${STANDARD_QUESTIONNAIRE_ID}/sequence`,
    { data: options },
  );
  if (!res.ok()) {
    throw new Error(`sequence failed ${res.status()}: ${await res.text()}`);
  }
  const body = (await res.json()) as {
    data?: { ordered_question_ids?: string[] };
  };
  const ids = body.data?.ordered_question_ids;
  if (!Array.isArray(ids) || ids.length !== EXPECTED_PRESENTED_COUNT) {
    throw new Error(`unexpected sequence body: ${JSON.stringify(body)}`);
  }
  return ids;
}

/** 为指定 session 写入已完成的标准模式进度（默认每题选 A 选项） */
export async function seedGuestRandomStandardComplete(
  request: APIRequestContext,
  sessionId: string,
): Promise<string[]> {
  const fullOrdered = await fetchRandomOrderedIds(request);
  const allAnswers = Object.fromEntries(fullOrdered.map((id) => [id, `${id}_A`])) as Record<
    string,
    string
  >;

  const progress = {
    schema_version: 1,
    mode: 'STANDARD' as const,
    questionnaire_id: STANDARD_QUESTIONNAIRE_ID,
    standard: {
      current_index: fullOrdered.length,
      ordered_question_ids: fullOrdered,
      answers: allAnswers,
      answered_count: fullOrdered.length,
    },
    meta: { started_at: new Date().toISOString(), last_client: 'e2e' },
  };

  const seed = await request.put(
    `${API_BASE}/progress?mode=STANDARD&session_id=${encodeURIComponent(sessionId)}`,
    {
      data: {
        progress_data: progress,
        if_match_revision: 0,
      },
    },
  );
  if (!seed.ok()) {
    throw new Error(`seed failed ${seed.status()}: ${await seed.text()}`);
  }
  return fullOrdered;
}
