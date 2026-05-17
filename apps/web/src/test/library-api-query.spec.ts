/**
 * 科普图书馆 URL query 构造单测（T4.1 F-A 筛选）。
 */
import { describe, expect, it } from 'vitest';

import { buildLibraryListQuery } from '@/lib/library-api';

describe('buildLibraryListQuery', () => {
  it('无筛选时返回空字符串', () => {
    expect(buildLibraryListQuery({})).toBe('');
  });

  it('category 与 tag 同时存在', () => {
    expect(buildLibraryListQuery({ category: 'theory', tag: 'MBTI' })).toBe(
      '?category=theory&tag=MBTI',
    );
  });

  it('仅 tag', () => {
    expect(buildLibraryListQuery({ tag: '信度' })).toBe('?tag=%E4%BF%A1%E5%BA%A6');
  });
});
