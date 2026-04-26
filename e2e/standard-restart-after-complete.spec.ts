/**
 * 端到端：标准测评完成态 seed 后，进入 `/test/standard` 展示「重新开始」入口，
 * 确认后应从第 1 题开始，且不再展示“本卷已完成”卡死态。
 */
import { randomUUID } from 'crypto';

import { test, expect, type APIRequestContext } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3001';

const ORDERED_12 = [
  'q01',
  'q02',
  'q03',
  'q04',
  'q05',
  'q06',
  'q07',
  'q08',
  'q09',
  'q10',
  'q11',
  'q12',
];

const stdCompleteProgress = {
  schema_version: 1,
  mode: 'STANDARD' as const,
  questionnaire_id: 'demo-standard-v1',
  standard: {
    current_index: 12,
    ordered_question_ids: ORDERED_12,
    answers: Object.fromEntries(ORDERED_12.map((qid) => [qid, `${qid}_A`])) as Record<
      string,
      string
    >,
    answered_count: 12,
  },
  meta: { started_at: new Date().toISOString(), last_client: 'e2e' },
};

async function assertGuestProgressIsStandardComplete(
  request: APIRequestContext,
  sessionId: string,
) {
  const getRes = await request.get(
    `${API_BASE}/progress?mode=STANDARD&session_id=${encodeURIComponent(sessionId)}`,
  );
  if (!getRes.ok()) {
    throw new Error(`seed GET failed ${getRes.status()}: ${await getRes.text()}`);
  }
  const body = (await getRes.json()) as unknown;
  if (
    typeof body !== 'object' ||
    body === null ||
    !('success' in body) ||
    (body as { success: unknown }).success !== true ||
    !('data' in body)
  ) {
    throw new Error(`unexpected GET body: ${JSON.stringify(body)}`);
  }
  const data = (body as { data: unknown }).data;
  if (typeof data !== 'object' || data === null) {
    throw new Error(`unexpected GET data: ${JSON.stringify(data)}`);
  }
  const pd = (data as { progress_data?: unknown }).progress_data;
  if (typeof pd !== 'object' || pd === null) {
    throw new Error(`unexpected progress_data: ${JSON.stringify(pd)}`);
  }
  const mode = (pd as { mode?: unknown }).mode;
  const std = (pd as { standard?: unknown }).standard;
  if (mode !== 'STANDARD' || typeof std !== 'object' || std === null) {
    throw new Error(`expected STANDARD snapshot, got: ${JSON.stringify(pd)}`);
  }
  const answered = (std as { answered_count?: unknown }).answered_count;
  const idx = (std as { current_index?: unknown }).current_index;
  if (answered !== 12 || idx !== 12) {
    throw new Error(
      `expected completed standard (answered_count=12, current_index=12), got: ${JSON.stringify(std)}`,
    );
  }
}

async function deleteProgressAllowMissing(request: APIRequestContext, sessionId: string) {
  const del = await request.delete(
    `${API_BASE}/progress?mode=STANDARD&session_id=${encodeURIComponent(sessionId)}`,
  );
  expect([200, 404]).toContain(del.status());
}

test.describe('标准测评完成后可重新开始', () => {
  test('完成态 seed -> 展示重开入口 -> 确认后从第 1 题开始', async ({ page, request }) => {
    const sessionId = `e2e-pw-${randomUUID()}`;

    const putRes = await request.put(
      `${API_BASE}/progress?mode=STANDARD&session_id=${encodeURIComponent(sessionId)}`,
      {
        data: {
          progress_data: stdCompleteProgress,
          if_match_revision: 0,
        },
      },
    );
    if (!putRes.ok()) {
      throw new Error(`seed PUT failed ${putRes.status()}: ${await putRes.text()}`);
    }

    await assertGuestProgressIsStandardComplete(request, sessionId);

    await page.addInitScript((sid: string) => {
      window.localStorage.setItem('ppa_guest_session_id', sid);
    }, sessionId);

    await page.goto('/test/standard');
    await expect(page.getByRole('heading', { name: '性格倾向小测' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText('本卷已完成')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: '重新开始' })).toBeVisible({ timeout: 30_000 });

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: '重新开始' }).click();

    await expect(page.getByText('本卷已完成')).toHaveCount(0);
    await expect(page.getByText(/第\s*1\s*\/\s*12\s*题/)).toBeVisible({ timeout: 30_000 });

    const maybeNewSid = await page.evaluate(() =>
      window.localStorage.getItem('ppa_guest_session_id'),
    );
    await deleteProgressAllowMissing(request, sessionId);
    if (maybeNewSid && maybeNewSid !== sessionId) {
      await deleteProgressAllowMissing(request, maybeNewSid);
    }
  });
});
