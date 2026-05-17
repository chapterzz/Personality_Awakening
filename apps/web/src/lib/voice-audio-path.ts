/**
 * 语音彩蛋静态 MP3 路径构建（T4.3）。
 */
import { normalizeVoiceMbtiType, type VoiceMbtiType } from '@/lib/voice-types';

/**
 * @param type MBTI 四字母类型
 * @returns public 目录下可 fetch 的 URL 路径
 */
export function buildVoiceAudioUrl(type: VoiceMbtiType | string): string {
  const normalized = normalizeVoiceMbtiType(String(type)) ?? String(type).toUpperCase();
  return `/audio/voice/${normalized}.mp3`;
}
