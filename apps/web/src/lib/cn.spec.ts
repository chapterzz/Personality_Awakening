/**
 * `cn` 单元测试。
 */
import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('拼接真值并忽略假值', () => {
    expect(cn('a', false, 'b', undefined, null, '', 'c')).toBe('a b c');
  });

  it('空入参得到空串', () => {
    expect(cn()).toBe('');
  });
});
