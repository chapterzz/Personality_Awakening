/**
 * Playwright：AVG 选分支后刷新页面仍停留在同一剧情节点（TemporarySession 续答，T2.2）。
 */
import { test, expect } from '@playwright/test';

test.describe('AVG 刷新续答', () => {
  test('选内向分支后 reload 仍展示 path_i 对白', async ({ page }) => {
    await page.goto('/test/avg');

    await expect(page.getByRole('button', { name: '继续' })).toBeVisible({ timeout: 60_000 });
    await page.getByRole('button', { name: '继续' }).click();

    await expect(page.getByRole('button', { name: '更常独处或小范围相处' })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole('button', { name: '更常独处或小范围相处' }).click();

    await expect(page.getByText('内向也很棒：深度专注是你的超能力。')).toBeVisible({
      timeout: 30_000,
    });

    await page.reload();

    await expect(page.getByText('内向也很棒：深度专注是你的超能力。')).toBeVisible({
      timeout: 60_000,
    });
  });
});
