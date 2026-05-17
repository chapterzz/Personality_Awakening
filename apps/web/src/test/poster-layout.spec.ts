/**
 * 海报布局与昵称解析单元测试（T4.2）。
 */
import { describe, expect, it } from 'vitest';

import {
  GUEST_POSTER_NICKNAME,
  resolvePosterNickname,
  truncatePosterSummary,
} from '@/lib/poster-layout';
import {
  POSTER_EXPORT_SCALE,
  POSTER_LOGICAL_HEIGHT,
  POSTER_LOGICAL_WIDTH,
} from '@/lib/poster-types';

describe('poster layout constants', () => {
  it('竖版 9:16 逻辑尺寸与 2× 导出', () => {
    expect(POSTER_LOGICAL_WIDTH).toBe(1080);
    expect(POSTER_LOGICAL_HEIGHT).toBe(1920);
    expect(POSTER_EXPORT_SCALE).toBe(2);
  });
});

describe('truncatePosterSummary', () => {
  it('超长截断', () => {
    const s = '一二三四五六七八九十十一十二十三十四十五十六十七十八十九二十';
    expect(truncatePosterSummary(s, 16)).toMatch(/…$/);
    expect(truncatePosterSummary(s, 16).length).toBeLessThanOrEqual(17);
  });
});

describe('resolvePosterNickname', () => {
  it('游客无昵称时为星球探索者', () => {
    expect(resolvePosterNickname(null)).toBe(GUEST_POSTER_NICKNAME);
  });

  it('登录用户使用存储昵称', () => {
    expect(resolvePosterNickname('星尘#921')).toBe('星尘#921');
  });

  it('超长昵称截断', () => {
    const long = '这是一个非常非常长的昵称需要截断处理';
    expect(resolvePosterNickname(long).length).toBeLessThanOrEqual(17);
  });
});
