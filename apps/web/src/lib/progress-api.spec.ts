/**
 * `progress-api` 响应解析单测：成功快照与 409 冲突体；DELETE 请求形态。
 */
import { describe, expect, it, vi } from 'vitest';

import { deleteProgress, parseConflictPayload, parseProgressSnapshot } from './progress-api';
import type { StandardProgressDataV1 } from './progress-data';

const sampleProgress: StandardProgressDataV1 = {
  schema_version: 1,
  mode: 'STANDARD',
  questionnaire_id: 'x',
  standard: {
    current_index: 1,
    answers: { q1: 'a' },
    ordered_question_ids: ['q1', 'q2'],
    answered_count: 1,
  },
};

describe('parseProgressSnapshot', () => {
  it('解析 GET/PUT 成功 data', () => {
    const snap = parseProgressSnapshot({
      session_id: 'sid',
      user_id: null,
      progress_data: sampleProgress,
      progress_revision: 3,
      updated_at: '2026-01-01T00:00:00.000Z',
      expires_at: '2026-01-08T00:00:00.000Z',
    });
    expect(snap.session_id).toBe('sid');
    expect(snap.progress_revision).toBe(3);
    expect(snap.progress_data.standard.current_index).toBe(1);
  });
});

describe('parseConflictPayload', () => {
  it('解析 409 体中的 progress_data 与 revision', () => {
    const c = parseConflictPayload({
      progress_data: sampleProgress,
      progress_revision: 7,
      updated_at: '2026-01-02T00:00:00.000Z',
    });
    expect(c.progress_revision).toBe(7);
    expect(c.progress_data.mode).toBe('STANDARD');
  });
});

describe('deleteProgress', () => {
  it('使用 DELETE 并携带 session_id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true, data: null, message: null }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await deleteProgress({ sessionId: 'sid-abc' });

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/progress');
    expect(calledUrl).toContain('session_id=sid-abc');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'DELETE' });

    vi.unstubAllGlobals();
  });
});
