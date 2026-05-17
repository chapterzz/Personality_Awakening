/**
 * poster-landing 单元测试（T4.3 旧海报 Q-A 兼容）。
 */
import { describe, expect, it } from 'vitest';

import { buildVoicePathFromPosterRef, parsePosterLandingQuery } from '@/lib/poster-landing';

describe('parsePosterLandingQuery', () => {
  it('from=poster 且 ref 合法时返回类型', () => {
    expect(parsePosterLandingQuery({ from: 'poster', ref: 'infp' })).toEqual({ type: 'INFP' });
  });

  it('缺少 from 或 ref 非法时返回 null', () => {
    expect(parsePosterLandingQuery({ from: 'poster', ref: 'XXXX' })).toBeNull();
    expect(parsePosterLandingQuery({ from: 'home', ref: 'INFP' })).toBeNull();
    expect(parsePosterLandingQuery({ from: 'poster', ref: null })).toBeNull();
  });
});

describe('buildVoicePathFromPosterRef', () => {
  it('生成语音页路径并保留 from=poster', () => {
    expect(buildVoicePathFromPosterRef('INFP')).toBe('/voice/INFP?from=poster');
  });
});
