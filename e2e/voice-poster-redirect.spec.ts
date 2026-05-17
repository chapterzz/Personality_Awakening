/**
 * 端到端：旧海报 Q-A 链接重定向至语音页（T4.3）。
 */
import { expect, test } from '@playwright/test';

test('poster query redirects to voice page', async ({ page }) => {
  await page.goto('/?from=poster&ref=INFP');
  await expect(page).toHaveURL(/\/voice\/INFP/, { timeout: 15_000 });
  await expect(page.getByRole('button', { name: /播放精灵语音/ })).toBeVisible();
});

test('voice page loads directly with from=poster', async ({ page }) => {
  await page.goto('/voice/ENFP?from=poster');
  await expect(page.getByText('来自好友的星球分享卡')).toBeVisible();
  await expect(page.getByRole('button', { name: /播放精灵语音/ })).toBeVisible();
});
