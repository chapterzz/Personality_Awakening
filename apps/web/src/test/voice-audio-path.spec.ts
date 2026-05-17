/**
 * voice-audio-path 单元测试（T4.3）。
 */
import { describe, expect, it } from 'vitest';

import { buildVoiceAudioUrl } from '@/lib/voice-audio-path';

describe('buildVoiceAudioUrl', () => {
  it('生成静态路径', () => {
    expect(buildVoiceAudioUrl('INFP')).toBe('/audio/voice/INFP.mp3');
  });

  it('小写输入归一为大写文件名', () => {
    expect(buildVoiceAudioUrl('enfp')).toBe('/audio/voice/ENFP.mp3');
  });
});
