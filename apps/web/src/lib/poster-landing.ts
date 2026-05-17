/**
 * 旧海报 Q-A 落地参数解析与语音页路径构建（T4.3）。
 */
import { normalizeVoiceMbtiType, type VoiceMbtiType } from '@/lib/voice-types';

export type PosterLandingResult = { type: VoiceMbtiType };

/**
 * 解析 `/?from=poster&ref={type}`；合法时返回归一化类型。
 */
export function parsePosterLandingQuery(params: {
  from?: string | null;
  ref?: string | null;
}): PosterLandingResult | null {
  if (params.from !== 'poster') return null;
  const ref = params.ref?.trim();
  if (!ref) return null;
  const type = normalizeVoiceMbtiType(ref);
  if (!type) return null;
  return { type };
}

/**
 * 由海报 ref 构建语音页客户端路径（保留 from=poster 追踪）。
 */
export function buildVoicePathFromPosterRef(type: VoiceMbtiType): string {
  return `/voice/${type}?from=poster`;
}
