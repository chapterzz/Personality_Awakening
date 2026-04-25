/**
 * 精灵互动 Hook（T2.3）：在标准/AVG 答题页复用“犹豫提示（>30s）”与“强烈摇摆互斥提示”。
 */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  DEFAULT_MUTEX_WINDOW_MS,
  DEFAULT_STRONG_WEIGHT_MIN,
  HESITATION_MS,
  detectMutexTrigger,
  pruneHistory,
  type AnswerEvent,
  type OptionSignal,
} from '@/lib/sprite-interaction';

export type SpritePromptKind = 'hesitation' | 'mutex';

export type SpritePrompt = {
  kind: SpritePromptKind;
  text: string;
};

export type UseSpriteInteractionOptions = {
  hesitationMs?: number;
  mutexWindowMs?: number;
  strongWeightMin?: 1 | 2 | 3;
  /** 生成文案（可由调用方注入本地常量；后续可替换为 CMS） */
  getHesitationLine: () => string;
  getMutexLine: (dimension: OptionSignal['dimension']) => string;
};

export type UseSpriteInteractionResult = {
  prompt: SpritePrompt | null;
  dismissPrompt: () => void;
  /** 设置当前“需要做选择”的上下文；变化会重置 30s 计时 */
  setChoiceContext: (ctx: { contextId: string; active: boolean }) => void;
  /** 记录一次用户选择，用于互斥检测；会自动清掉犹豫提示 */
  recordChoice: (signal: OptionSignal, sourceId?: string) => void;
};

export function useSpriteInteraction(
  opts: UseSpriteInteractionOptions,
): UseSpriteInteractionResult {
  const hesitationMs = opts.hesitationMs ?? HESITATION_MS;
  const mutexWindowMs = opts.mutexWindowMs ?? DEFAULT_MUTEX_WINDOW_MS;
  const strongWeightMin = opts.strongWeightMin ?? DEFAULT_STRONG_WEIGHT_MIN;
  const getHesitationLine = opts.getHesitationLine;
  const getMutexLine = opts.getMutexLine;

  const [prompt, setPrompt] = useState<SpritePrompt | null>(null);

  const choiceRef = useRef<{ contextId: string; active: boolean; enteredAtMs: number } | null>(
    null,
  );
  const timerRef = useRef<number | null>(null);

  const historyRef = useRef<AnswerEvent[]>([]);

  const dismissPrompt = useCallback(() => setPrompt(null), []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleHesitationCheck = useCallback(
    (enteredAtMs: number) => {
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        const now = Date.now();
        const current = choiceRef.current;
        if (!current || !current.active || current.enteredAtMs !== enteredAtMs) return;
        const elapsed = now - current.enteredAtMs;
        if (elapsed >= hesitationMs) {
          setPrompt({ kind: 'hesitation', text: getHesitationLine() });
        }
      }, hesitationMs);
    },
    [clearTimer, getHesitationLine, hesitationMs],
  );

  const setChoiceContext = useCallback(
    (ctx: { contextId: string; active: boolean }) => {
      const prev = choiceRef.current;
      const sameKey = prev?.contextId === ctx.contextId && prev?.active === ctx.active;
      if (sameKey) return;

      const now = Date.now();
      choiceRef.current = { contextId: ctx.contextId, active: ctx.active, enteredAtMs: now };

      // 上下文变化：重置“犹豫提示”并重新计时；互斥提示应允许跨题显示一段时间供用户看见。
      setPrompt((prev) => (prev?.kind === 'hesitation' ? null : prev));

      if (!ctx.active) {
        clearTimer();
        return;
      }

      scheduleHesitationCheck(now);
    },
    [clearTimer, scheduleHesitationCheck],
  );

  const recordChoice = useCallback(
    (signal: OptionSignal, sourceId?: string) => {
      // 做出选择：清掉犹豫提示（即便后续要弹互斥提示）
      setPrompt(null);
      clearTimer();

      const now = Date.now();
      const latest: AnswerEvent = { ...signal, atMs: now, sourceId };
      const pruned = pruneHistory(historyRef.current, now, mutexWindowMs);
      const hit = detectMutexTrigger(pruned, latest, {
        windowMs: mutexWindowMs,
        strongWeightMin,
      });
      historyRef.current = [...pruned, latest];

      if (hit) {
        setPrompt({ kind: 'mutex', text: getMutexLine(hit.dimension) });
      }
    },
    [clearTimer, getMutexLine, mutexWindowMs, strongWeightMin],
  );

  // 卸载清理
  useEffect(() => clearTimer, [clearTimer]);

  return useMemo(
    () => ({
      prompt,
      dismissPrompt,
      setChoiceContext,
      recordChoice,
    }),
    [dismissPrompt, prompt, recordChoice, setChoiceContext],
  );
}
