/**
 * 海报下载文件名单元测试（T4.2）。
 */
import { describe, expect, it } from 'vitest';

import { buildPosterFilename } from '@/lib/poster-download';

describe('buildPosterFilename', () => {
  it('生成 ppa-poster 前缀与日期', () => {
    expect(buildPosterFilename('infp', '2026-05-17T08:00:00.000Z')).toBe(
      'ppa-poster-INFP-20260517.png',
    );
  });
});
