/**
 * 海报精灵称号单元测试（T4.2）。
 */
import { describe, expect, it } from 'vitest';

import { pickSpriteLabel } from '@/lib/poster-sprite';

describe('pickSpriteLabel', () => {
  it('E 开头为曦光', () => {
    expect(pickSpriteLabel('ENFP')).toBe('曦光领航精灵');
  });

  it('I 开头为月影', () => {
    expect(pickSpriteLabel('INFP')).toBe('月影探索精灵');
  });
});
