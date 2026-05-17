/**
 * 海报分享 URL 单元测试（T4.2）。
 */
import { describe, expect, it } from 'vitest';

import { buildPosterShareUrl } from '@/lib/poster-qr';

describe('buildPosterShareUrl', () => {
  it('指向 /voice/{type}?from=poster（T4.3 L3）', () => {
    const url = buildPosterShareUrl('https://planet.example', 'infp');
    expect(url).toBe('https://planet.example/voice/INFP?from=poster');
  });

  it('去掉 origin 末尾斜杠', () => {
    const url = buildPosterShareUrl('https://planet.example/', 'ENFP');
    expect(url).toBe('https://planet.example/voice/ENFP?from=poster');
  });
});
