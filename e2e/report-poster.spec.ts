/**
 * 端到端：标准模式完成进入报告页后，应展示海报生成入口（T4.2 smoke）。
 */
import { randomUUID } from 'crypto';

import { expect, test } from '@playwright/test';

import { seedGuestAdaptiveStandardComplete } from './helpers/adaptive-standard-seed';

test('standard completed -> report page shows poster action', async ({ page, request }) => {
  const sessionId = `e2e-pw-poster-${randomUUID()}`;

  await seedGuestAdaptiveStandardComplete(request, sessionId);

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
          mode: 'STANDARD',
          mbti_type: 'ENTJ',
          scores: {
            EI: { E: 8, I: 2, winner: 'E', delta: 6 },
            SN: { S: 3, N: 7, winner: 'N', delta: 4 },
            TF: { T: 7, F: 4, winner: 'T', delta: 3 },
            JP: { J: 6, P: 5, winner: 'J', delta: 1 },
          },
        },
        message: 'ok',
      }),
    });
  });

  await page.goto('/test/standard');
  await expect(page.getByRole('button', { name: '查看结果报告' })).toBeVisible({ timeout: 60_000 });
  await page.getByRole('button', { name: '查看结果报告' }).click();

  await expect(page).toHaveURL(/\/report\?mode=STANDARD$/, { timeout: 60_000 });
  await expect(page.getByRole('button', { name: /生成.*海报/ })).toBeVisible({ timeout: 30_000 });
});
