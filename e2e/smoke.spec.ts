/**
 * Playwright：学生端首页 smoke（可见 Next 默认引导文案）。
 */
import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('首页可访问并包含 Next 引导文案', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Get started by editing')).toBeVisible();
  });
});
