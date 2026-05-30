/**
 * Playwright：科普图书馆列表 → 详情最小 smoke（T4.1）。
 */
import { test, expect } from '@playwright/test';

test.describe('科普图书馆', () => {
  test('library redirects to about-mbti article', async ({ page }) => {
    await page.goto('/library');
    await expect(page).toHaveURL(/\/library\/about-mbti/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: '关于 MBTI' })).toBeVisible();
    await expect(page.locator('article.library-prose, article')).toBeVisible();
  });
});
