/**
 * 语音彩蛋落地页：/voice/[type]，扫码或分享链播放对应 MBTI 预录制语音（T4.3）。
 */
import { notFound } from 'next/navigation';

import { VoicePlayer } from '@/components/voice/voice-player';
import { normalizeVoiceMbtiType } from '@/lib/voice-types';

type VoicePageProps = {
  params: { type: string };
  searchParams: { from?: string };
};

/**
 * 校验动态 type；非法四字母则 404。
 */
export default function VoicePage({ params, searchParams }: VoicePageProps) {
  const mbtiType = normalizeVoiceMbtiType(params.type);
  if (!mbtiType) notFound();

  const fromPoster = searchParams.from === 'poster';

  return <VoicePlayer mbtiType={mbtiType} fromPoster={fromPoster} />;
}
