/**
 * 端到端：AVG 完成态 seed 后，再次进入 `/test/avg` 应从新一轮开始（不应卡在完成态）。
 */
import { randomUUID } from 'crypto';

import { test, expect, type APIRequestContext } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3001';

const avgCompleteProgress = {
  schema_version: 1,
  mode: 'AVG' as const,
  questionnaire_id: 'demo-avg-v1',
  avg: {
    script_id: 'demo-avg-v1',
    node_id: 'closing',
    chapter: 'EI' as const,
    answers: { energy_choice: 'opt_in' },
    visited_node_ids: ['intro', 'energy_choice', 'path_i', 'closing'],
  },
  meta: { started_at: new Date().toISOString(), last_client: 'e2e' },
};

async function deleteAvgProgressAllowMissing(request: APIRequestContext, sessionId: string) {
  const del = await request.delete(
    `${API_BASE}/progress?mode=AVG&session_id=${encodeURIComponent(sessionId)}`,
  );
  expect([200, 404]).toContain(del.status());
}

test.describe('AVG 完成后重新开始', () => {
  test('完成态 seed -> 回首页 -> 再进入 AVG 仍可开始新一轮', async ({ page, request }) => {
    const sessionId = `e2e-pw-${randomUUID()}`;

    const putRes = await request.put(
      `${API_BASE}/progress?mode=AVG&session_id=${encodeURIComponent(sessionId)}`,
      {
        data: {
          progress_data: avgCompleteProgress,
          if_match_revision: 0,
        },
      },
    );
    if (!putRes.ok()) {
      throw new Error(`seed PUT failed ${putRes.status()}: ${await putRes.text()}`);
    }

    await page.addInitScript((sid: string) => {
      window.localStorage.setItem('ppa_guest_session_id', sid);
    }, sessionId);

    await page.goto('/test/avg');
    await expect(page.getByText('本段剧情已完成')).toBeVisible({ timeout: 30_000 });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: '性格星球：觉醒计划' })).toBeVisible();

    await page.getByRole('link', { name: 'AVG 剧情（演示）' }).click();
    await expect(page.getByRole('heading', { name: '星港夜话' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('本段剧情已完成')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: '重新开始' })).toBeVisible({ timeout: 30_000 });

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: '重新开始' }).click();

    await expect(page.getByText('本段剧情已完成')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '继续' })).toBeVisible({ timeout: 30_000 });

    const maybeNewSid = await page.evaluate(() =>
      window.localStorage.getItem('ppa_guest_session_id'),
    );
    await deleteAvgProgressAllowMissing(request, sessionId);
    if (maybeNewSid && maybeNewSid !== sessionId) {
      await deleteAvgProgressAllowMissing(request, maybeNewSid);
    }
  });
});
