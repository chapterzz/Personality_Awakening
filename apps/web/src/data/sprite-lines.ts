/**
 * 精灵互动文案（T2.3，本地常量；后续由 CMS/T4.7 替换）。
 */

import type { DimensionTag } from '@/lib/sprite-interaction';

const HESITATION_LINES = [
  '你在犹豫吗？不必完美，选更像“现在的你”的那一侧就好。',
  '如果两个都像你，也没关系。先凭第一直觉选一个。',
  '想一想：这个场景里，你更常做的是哪一个？',
] as const;

const MUTEX_LINES: Record<DimensionTag, readonly string[]> = {
  EI: ['E 和 I 都很有你！也许你会在不同场景切换能量模式？', '你在外放和内收之间来回摇摆呢～'],
  SN: ['S 与 N 都被你点亮了：既看细节也看可能性？', '你在“具体”与“想象”之间反复横跳～'],
  TF: ['T 与 F 都很强：既讲道理也很在意感受。', '你在理性与共情之间有点纠结哦～'],
  JP: ['J 与 P 都有你：计划与随性并存。', '你在“按部就班”和“临场发挥”之间摇摆呢～'],
} as const;

function pickStableString(items: readonly string[]): string {
  // MVP：不引入随机种子，直接取第一条，保证测试与演示稳定
  return items[0] ?? '';
}

export function getHesitationLine(): string {
  return pickStableString(HESITATION_LINES);
}

export function getMutexLine(dimension: DimensionTag): string {
  return pickStableString(MUTEX_LINES[dimension] ?? MUTEX_LINES.EI);
}
