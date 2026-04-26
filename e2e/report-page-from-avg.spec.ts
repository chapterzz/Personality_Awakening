/**
 * 端到端：AVG 模式完成态点击“查看结果报告”后，应跳转并渲染报告核心信息。
 */
import { randomUUID } from 'crypto';

import { expect, test } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3001';

test('avg completed -> report page', async ({ page, request }) => {
  const sessionId = `e2e-pw-${randomUUID()}`;
  const progress = {
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

  const seed = await request.put(
    `${API_BASE}/progress?mode=AVG&session_id=${encodeURIComponent(sessionId)}`,
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

  await page.addInitScript((sid: string) => {
    window.localStorage.setItem('ppa_guest_session_id', sid);
  }, sessionId);
  await page.route('**/scoring/mbti', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          mode: 'AVG',
          mbti_type: 'INFP',
          scores: {
            EI: { E: 3, I: 8, winner: 'I', delta: 5 },
            SN: { S: 4, N: 6, winner: 'N', delta: 2 },
            TF: { T: 2, F: 9, winner: 'F', delta: 7 },
            JP: { J: 5, P: 6, winner: 'P', delta: 1 },
          },
        },
        message: 'ok',
      }),
    });
  });

  await page.goto('/test/avg');
  await expect(page.getByRole('button', { name: '查看结果报告' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: '查看结果报告' }).click();

  await expect(page).toHaveURL(/\/report\?mode=AVG$/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { level: 1, name: 'INFP' })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText('四维雷达图')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('人格精灵')).toBeVisible({ timeout: 30_000 });
});
