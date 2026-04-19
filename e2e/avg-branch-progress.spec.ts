/**
 * Playwright：AVG 演示页展示「分支进度」与 0/1 初始分子（含 API 时的加载态）。
 */
import { test, expect } from '@playwright/test';

test.describe('AVG 分支进度 UI', () => {
  test('可见「分支进度」且初始为 0/1', async ({ page }) => {
    await page.goto('/test/avg');
    await expect(page.getByText('分支进度')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('0 / 1')).toBeVisible({ timeout: 30_000 });
  });
});
