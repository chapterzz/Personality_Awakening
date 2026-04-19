/**
 * Playwright：首页主内容区限宽（max-w-2xl），防宽屏布局回归。
 */
import { test, expect } from '@playwright/test';

test.describe('首页布局', () => {
  test('主栏首层容器宽度不超过 2xl 档位', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const root = page.locator('main').locator('> div').first();
    await expect(root).toBeVisible();
    const box = await root.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(720);
  });
});
