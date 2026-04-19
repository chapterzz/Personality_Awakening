/**
 * Playwright：学生端首页 smoke（T1.6 壳层与品牌文案可见）。
 */
import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('首页可访问并展示品牌标题', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '性格星球：觉醒计划' })).toBeVisible();
  });
});
