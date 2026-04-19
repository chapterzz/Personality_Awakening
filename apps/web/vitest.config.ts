/**
 * Web 包 Vitest 配置：jsdom、React 插件与路径别名；默认单 worker 降低 jsdom 堆内存峰值。
 */
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: false,
    /** 多 worker + jsdom 在部分环境下易 OOM；单测总耗时短，串行更稳 */
    maxWorkers: 1,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
