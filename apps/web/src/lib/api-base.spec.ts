/**
 * `getBrowserApiBaseUrl` 单元测试（环境变量分支）。
 */
import { describe, it, expect, afterEach } from 'vitest';
import { getBrowserApiBaseUrl } from './api-base';

describe('getBrowserApiBaseUrl', () => {
  const original = process.env.NEXT_PUBLIC_API_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = original;
    }
  });

  it('无环境变量时返回本地 API 默认端口', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(getBrowserApiBaseUrl()).toBe('http://127.0.0.1:3001');
  });

  it('尊重 NEXT_PUBLIC_API_URL', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    expect(getBrowserApiBaseUrl()).toBe('https://api.example.com');
  });
});
