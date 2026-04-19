/**
 * Playwright：请求 API `/health`，校验 JSON 契约（与集成测试互补）。
 */
import { test, expect } from '@playwright/test';

test.describe('API 健康（与 web 并行起服务）', () => {
  test('GET /health 返回约定 JSON', async ({ request }) => {
    const res = await request.get('http://127.0.0.1:3001/health');
    expect(res.ok()).toBeTruthy();
    await expect(res.json()).resolves.toEqual({
      status: 'ok',
      service: 'ppa-api',
    });
  });
});
