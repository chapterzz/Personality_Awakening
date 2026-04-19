/**
 * Playwright E2E 配置：测试目录、Chromium、可选本地 webServer 与 CI 策略。
 *
 * 默认验证 Next 学生端（3000）；API 契约以 apps/api 的 Jest/supertest 为主。
 * 首次运行前：`pnpm exec playwright install chromium`
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PW_SKIP_WEBSERVER
    ? undefined
    : [
        {
          command: 'pnpm --filter web dev',
          url: 'http://127.0.0.1:3000',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
        {
          command: 'pnpm --filter api run serve:e2e',
          url: 'http://127.0.0.1:3001/health',
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
        },
      ],
});
