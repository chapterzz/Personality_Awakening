/**
 * 精灵互动逻辑（T2.3）：犹豫检测与“强烈摇摆”互斥检测的纯函数实现（无 React 依赖，便于单测复用）。
 */

export type DimensionTag = 'EI' | 'SN' | 'TF' | 'JP';

export type OptionSide = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

export type OptionSignal = {
  dimension: DimensionTag;
  side: OptionSide;
  weight: 1 | 2 | 3;
};

export type AnswerEvent = OptionSignal & {
  atMs: number;
  /** 业务定位：标准模式 question_id 或 AVG node_id（仅用于排查/可选展示） */
  sourceId?: string;
};

export const HESITATION_MS = 30_000;
export const DEFAULT_MUTEX_WINDOW_MS = 120_000;
export const DEFAULT_STRONG_WEIGHT_MIN: 1 | 2 | 3 = 2;

export function shouldPromptHesitation(opts: {
  elapsedMs: number;
  hasChosen: boolean;
  thresholdMs?: number;
}): boolean {
  const threshold = opts.thresholdMs ?? HESITATION_MS;
  if (opts.hasChosen) return false;
  return opts.elapsedMs >= threshold;
}

export function isOppositeSide(dimension: DimensionTag, a: OptionSide, b: OptionSide): boolean {
  switch (dimension) {
    case 'EI':
      return (a === 'E' && b === 'I') || (a === 'I' && b === 'E');
    case 'SN':
      return (a === 'S' && b === 'N') || (a === 'N' && b === 'S');
    case 'TF':
      return (a === 'T' && b === 'F') || (a === 'F' && b === 'T');
    case 'JP':
      return (a === 'J' && b === 'P') || (a === 'P' && b === 'J');
  }
}

export type MutexTrigger = {
  kind: 'mutex';
  dimension: DimensionTag;
  latest: AnswerEvent;
  previous: AnswerEvent;
  deltaMs: number;
};

/**
 * 检测“逻辑互斥”（强烈摇摆）：
 * - 在时间窗口内（默认 120s）
 * - 同一维度
 * - 两次选择均为强烈（weight >= strongWeightMin，默认 2）
 * - 且侧向相反（E↔I / S↔N / T↔F / J↔P）
 */
export function detectMutexTrigger(
  history: readonly AnswerEvent[],
  latest: AnswerEvent,
  opts?: {
    windowMs?: number;
    strongWeightMin?: 1 | 2 | 3;
  },
): MutexTrigger | null {
  const windowMs = opts?.windowMs ?? DEFAULT_MUTEX_WINDOW_MS;
  const strongMin = opts?.strongWeightMin ?? DEFAULT_STRONG_WEIGHT_MIN;

  if (latest.weight < strongMin) return null;

  for (let i = history.length - 1; i >= 0; i--) {
    const prev = history[i];
    const delta = latest.atMs - prev.atMs;
    if (delta <= 0) continue;
    if (delta > windowMs) break;
    if (prev.dimension !== latest.dimension) continue;
    if (prev.weight < strongMin) continue;
    if (!isOppositeSide(latest.dimension, prev.side, latest.side)) continue;
    return {
      kind: 'mutex',
      dimension: latest.dimension,
      latest,
      previous: prev,
      deltaMs: delta,
    };
  }

  return null;
}

export function pruneHistory(
  history: readonly AnswerEvent[],
  nowMs: number,
  windowMs: number,
): AnswerEvent[] {
  const cutoff = nowMs - windowMs;
  // history 一般很短，线性过滤即可
  return history.filter((e) => e.atMs >= cutoff && e.atMs <= nowMs);
}
