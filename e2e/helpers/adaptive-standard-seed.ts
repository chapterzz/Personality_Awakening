/**
 * E2E 辅助：为 adaptive-demo-v1 生成「标准模式已完成」的游客进度快照。
 * 通过真实 sequence API 获取题序，避免与前端 useAdaptiveStandardTest 漂移。
 */
import type { APIRequestContext } from '@playwright/test';

export const ADAPTIVE_QUESTIONNAIRE_ID = 'adaptive-demo-v1';

const API_BASE = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3001';

/** 调用 POST /questionnaire/:id/sequence 获取题序 */
export async function fetchAdaptiveOrderedIds(
  request: APIRequestContext,
  answers?: Record<string, string>,
): Promise<string[]> {
  const res = await request.post(
    `${API_BASE}/questionnaire/${ADAPTIVE_QUESTIONNAIRE_ID}/sequence`,
    {
      data: answers ? { answers } : {},
    },
  );
  if (!res.ok()) {
    throw new Error(`sequence failed ${res.status()}: ${await res.text()}`);
  }
  const body = (await res.json()) as {
    data?: { ordered_question_ids?: string[] };
  };
  const ids = body.data?.ordered_question_ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error(`unexpected sequence body: ${JSON.stringify(body)}`);
  }
  return ids;
}

/** 为指定 session 写入已完成的标准模式进度（默认每题选 A 选项） */
export async function seedGuestAdaptiveStandardComplete(
  request: APIRequestContext,
  sessionId: string,
): Promise<void> {
  const screeningIds = await fetchAdaptiveOrderedIds(request);
  const screeningAnswers = Object.fromEntries(screeningIds.map((id) => [id, `${id}_A`])) as Record<
    string,
    string
  >;
  const fullOrdered = await fetchAdaptiveOrderedIds(request, screeningAnswers);
  const allAnswers = Object.fromEntries(fullOrdered.map((id) => [id, `${id}_A`])) as Record<
    string,
    string
  >;

  const progress = {
    schema_version: 1,
    mode: 'STANDARD' as const,
    questionnaire_id: ADAPTIVE_QUESTIONNAIRE_ID,
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
}
