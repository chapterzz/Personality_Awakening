/**
 * 语音彩蛋 MBTI 类型校验（T4.3）：与 report-copy 16 型对齐。
 */
import type { MbtiType } from '@/lib/report-copy';

/** 语音页与静态资源共用的 MBTI 四字母类型 */
export type VoiceMbtiType = MbtiType;

/** 16 型常量列表，供路由与资源命名校验 */
export const VOICE_MBTI_TYPES: readonly VoiceMbtiType[] = [
  'INTJ',
  'INTP',
  'ENTJ',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISFJ',
  'ESTJ',
  'ESFJ',
  'ISTP',
  'ISFP',
  'ESTP',
  'ESFP',
] as const;

const VOICE_MBTI_SET = new Set<string>(VOICE_MBTI_TYPES);

/**
 * 判断字符串是否为合法 MBTI 四字母类型（大小写不敏感）。
 */
export function isVoiceMbtiType(value: string): boolean {
  return VOICE_MBTI_SET.has(value.trim().toUpperCase());
}

/**
 * 将路由参数归一为大写四字母；非法返回 null。
 */
export function normalizeVoiceMbtiType(value: string): VoiceMbtiType | null {
  const upper = value.trim().toUpperCase();
  return isVoiceMbtiType(upper) ? (upper as VoiceMbtiType) : null;
}
