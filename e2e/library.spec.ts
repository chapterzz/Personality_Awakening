/**
 * Playwright：科普图书馆列表 → 详情最小 smoke（T4.1）。
 */
import { test, expect } from '@playwright/test';

test.describe('科普图书馆', () => {
  test('library list to detail', async ({ page }) => {
    await page.goto('/library');
    await expect(page.getByRole('heading', { name: '科普图书馆' })).toBeVisible();

    const articleLink = page.locator('a.clay-card').first();
    await expect(articleLink).toBeVisible({ timeout: 15_000 });
    await articleLink.click();

    await expect(page.locator('article.library-prose, article')).toBeVisible();
  });
});
