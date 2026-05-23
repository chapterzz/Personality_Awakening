/**
 * 学生端精灵文案公开 API 客户端（T4.7）。
 */
import { getBrowserApiBaseUrl } from '@/lib/api-base';
import type { DimensionTag } from '@/lib/sprite-interaction';

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message: string | null;
};

export type SpritePrompts = {
  hesitationLines: string[];
  mutexLines: Record<string, string[]>;
};

function apiBase(): string {
  return getBrowserApiBaseUrl().replace(/\/$/, '');
}

/** 拉取已发布精灵互动文案 */
export async function fetchPublishedSpritePrompts(): Promise<SpritePrompts> {
  const res = await fetch(`${apiBase()}/sprite-prompts`);
  const body = (await res.json()) as ApiEnvelope<SpritePrompts>;
  if (!res.ok || !body.success) {
    throw new Error(body.message ?? 'sprite_prompts_fetch_failed');
  }
  return body.data;
}

/**
 * 由 API 文案构造精灵 Hook 所需的 getter 工厂（MVP 取每条首项，与 sprite-lines.ts 一致）。
 */
export function createSpriteLineGetters(prompts: SpritePrompts) {
  return {
    getHesitationLine: () => prompts.hesitationLines[0] ?? '',
    getMutexLine: (d: DimensionTag) => prompts.mutexLines[d]?.[0] ?? '',
  };
}
