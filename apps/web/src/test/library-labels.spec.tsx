/**
 * 科普图书馆文案单测：分类中文名（T4.1）。
 */
import { describe, expect, it } from 'vitest';

import { getCategoryLabel } from '@/lib/library-labels';

describe('getCategoryLabel', () => {
  it('返回中文分类名', () => {
    expect(getCategoryLabel('theory')).toBe('基础理论');
    expect(getCategoryLabel('anti_label')).toBe('反标签');
    expect(getCategoryLabel('celebrity')).toBe('名人案例');
  });
});
