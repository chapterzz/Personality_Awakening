/**
 * T2.3 精灵互动算法单测：互斥（强烈摇摆）检测与犹豫判定纯函数。
 */
import { describe, expect, it } from 'vitest';

import {
  detectMutexTrigger,
  isOppositeSide,
  pruneHistory,
  shouldPromptHesitation,
  type AnswerEvent,
} from '@/lib/sprite-interaction';

describe('sprite-interaction', () => {
  it('shouldPromptHesitation: 仅当未选择且 elapsed > threshold 时触发', () => {
    expect(
      shouldPromptHesitation({ elapsedMs: 30_001, hasChosen: false, thresholdMs: 30_000 }),
    ).toBe(true);
    expect(
      shouldPromptHesitation({ elapsedMs: 30_000, hasChosen: false, thresholdMs: 30_000 }),
    ).toBe(true);
    expect(
      shouldPromptHesitation({ elapsedMs: 60_000, hasChosen: true, thresholdMs: 30_000 }),
    ).toBe(false);
  });

  it('isOppositeSide: 仅识别同维度的相反侧向', () => {
    expect(isOppositeSide('EI', 'E', 'I')).toBe(true);
    expect(isOppositeSide('EI', 'E', 'E')).toBe(false);
    expect(isOppositeSide('SN', 'S', 'N')).toBe(true);
    expect(isOppositeSide('TF', 'F', 'T')).toBe(true);
    expect(isOppositeSide('JP', 'P', 'J')).toBe(true);
  });

  it('detectMutexTrigger: 同维度窗口内强烈反向触发', () => {
    const history: AnswerEvent[] = [
      { atMs: 1000, dimension: 'EI', side: 'E', weight: 2, sourceId: 'q01' },
      { atMs: 2000, dimension: 'SN', side: 'S', weight: 3, sourceId: 'q06' },
    ];
    const latest: AnswerEvent = {
      atMs: 60_000,
      dimension: 'EI',
      side: 'I',
      weight: 2,
      sourceId: 'q05',
    };
    const out = detectMutexTrigger(history, latest, { windowMs: 120_000, strongWeightMin: 2 });
    expect(out?.kind).toBe('mutex');
    expect(out?.dimension).toBe('EI');
    expect(out?.previous.sourceId).toBe('q01');
  });

  it('detectMutexTrigger: 超出窗口不触发', () => {
    const history: AnswerEvent[] = [{ atMs: 0, dimension: 'EI', side: 'E', weight: 3 }];
    const latest: AnswerEvent = { atMs: 200_000, dimension: 'EI', side: 'I', weight: 3 };
    expect(
      detectMutexTrigger(history, latest, { windowMs: 120_000, strongWeightMin: 2 }),
    ).toBeNull();
  });

  it('detectMutexTrigger: 强度不足不触发', () => {
    const history: AnswerEvent[] = [{ atMs: 0, dimension: 'EI', side: 'E', weight: 1 }];
    const latest: AnswerEvent = { atMs: 10_000, dimension: 'EI', side: 'I', weight: 2 };
    expect(
      detectMutexTrigger(history, latest, { windowMs: 120_000, strongWeightMin: 2 }),
    ).toBeNull();
  });

  it('pruneHistory: 移除窗口外事件', () => {
    const history: AnswerEvent[] = [
      { atMs: 0, dimension: 'EI', side: 'E', weight: 2 },
      { atMs: 50_000, dimension: 'EI', side: 'E', weight: 2 },
      { atMs: 200_000, dimension: 'EI', side: 'E', weight: 2 },
    ];
    const out = pruneHistory(history, 200_000, 120_000);
    expect(out.map((e) => e.atMs)).toEqual([200_000]);
  });
});
