/**
 * 端到端：服务端已为 AVG 收束态时，标准测评页应自动迁移为 STANDARD 并展示题目（非 wrong_mode）。
 * 与 Vitest 单测互补：此处覆盖真实 fetch + Next 页面；单测覆盖 hook 分支。
 */
import { randomUUID } from 'crypto';

import { test, expect } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3001';

const avgAtClosingProgress = {
  schema_version: 1,
  mode: 'AVG' as const,
  questionnaire_id: 'demo-avg-v1',
  avg: {
    script_id: 'demo-avg-v1',
    node_id: 'closing',
    chapter: 'EI' as const,
    answers: { energy_choice: 'opt_in' },
    visited_node_ids: ['intro', 'energy_choice', 'path_i', 'closing'],
  },
  meta: { started_at: new Date().toISOString(), last_client: 'e2e' },
};

test.describe('AVG 收束后会话进入标准测评', () => {
  test('标准测评页展示问卷标题且非 AVG 拦截卡片', async ({ page, request }) => {
    const sessionId = `e2e-pw-${randomUUID()}`;

    const putRes = await request.put(
      `${API_BASE}/progress?session_id=${encodeURIComponent(sessionId)}`,
      {
        data: {
          progress_data: avgAtClosingProgress,
          if_match_revision: 0,
        },
      },
    );
    if (!putRes.ok()) {
      throw new Error(`seed PUT failed ${putRes.status()}: ${await putRes.text()}`);
    }

    await page.addInitScript((sid: string) => {
      window.localStorage.setItem('ppa_guest_session_id', sid);
    }, sessionId);

    await page.goto('/test/standard');

    await expect(page.getByRole('heading', { name: '性格倾向小测' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText('当前会话为 AVG 剧情进度')).toHaveCount(0);

    const del = await request.delete(
      `${API_BASE}/progress?session_id=${encodeURIComponent(sessionId)}`,
    );
    expect(del.ok()).toBeTruthy();
  });
});
