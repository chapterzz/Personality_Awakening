/**
 * 海报站点 origin 解析单元测试（T4.2 / T4.3）。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  isLoopbackHost,
  isLoopbackOrigin,
  resolvePosterAppOrigin,
  resolvePosterAppOriginAsync,
} from '@/lib/poster-app-url';

describe('isLoopbackHost', () => {
  it('识别 localhost 与 127.0.0.1', () => {
    expect(isLoopbackHost('127.0.0.1')).toBe(true);
    expect(isLoopbackHost('localhost')).toBe(true);
    expect(isLoopbackHost('192.168.1.10')).toBe(false);
  });
});

describe('resolvePosterAppOrigin', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('无环境变量时使用 fallback 并去尾斜杠', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    expect(resolvePosterAppOrigin('http://127.0.0.1:3000/')).toBe('http://127.0.0.1:3000');
  });

  it('优先使用 NEXT_PUBLIC_APP_URL', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://planet.prod/');
    expect(resolvePosterAppOrigin('http://127.0.0.1:3000')).toBe('https://planet.prod');
  });
});

describe('resolvePosterAppOriginAsync', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('有 NEXT_PUBLIC_APP_URL 时不请求 dev API', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://192.168.2.9:3000');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await resolvePosterAppOriginAsync('http://127.0.0.1:3000');
    expect(result).toEqual({ origin: 'http://192.168.2.9:3000', usedLanFallback: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('loopback 时采用 dev API 返回的局域网 origin', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ origin: 'http://192.168.1.50:3000' }),
      }),
    );

    const result = await resolvePosterAppOriginAsync('http://127.0.0.1:3000');
    expect(result).toEqual({ origin: 'http://192.168.1.50:3000', usedLanFallback: true });
  });
});

describe('isLoopbackOrigin', () => {
  it('识别 loopback URL', () => {
    expect(isLoopbackOrigin('http://127.0.0.1:3000')).toBe(true);
    expect(isLoopbackOrigin('http://192.168.0.8:3000')).toBe(false);
  });
});
