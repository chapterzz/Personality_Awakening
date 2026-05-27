/**
 * AVG 背景冷暖判定单测。
 */
import { describe, expect, it } from 'vitest';

import { classifyRgb, toneFromGradient } from './avg-background-tone';

describe('classifyRgb', () => {
  it('偏红/橙判为 warm', () => {
    expect(classifyRgb(200, 120, 80)).toBe('warm');
  });

  it('偏蓝/青判为 cool', () => {
    expect(classifyRgb(70, 110, 190)).toBe('cool');
  });

  it('接近灰判为 neutral', () => {
    expect(classifyRgb(128, 128, 128)).toBe('neutral');
  });
});

describe('toneFromGradient', () => {
  it('amber/orange 渐变判 warm', () => {
    expect(toneFromGradient('from-amber-950 via-orange-900')).toBe('warm');
  });

  it('indigo/slate 渐变判 cool', () => {
    expect(toneFromGradient('from-indigo-950 via-slate-900')).toBe('cool');
  });
});
