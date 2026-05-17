/**
 * voice-types 单元测试（T4.3）。
 */
import { describe, expect, it } from 'vitest';

import { isVoiceMbtiType, normalizeVoiceMbtiType } from '@/lib/voice-types';

describe('voice-types', () => {
  it('接受 16 型', () => {
    expect(isVoiceMbtiType('infp')).toBe(true);
    expect(normalizeVoiceMbtiType('infp')).toBe('INFP');
  });

  it('拒绝非法', () => {
    expect(isVoiceMbtiType('XXXX')).toBe(false);
    expect(normalizeVoiceMbtiType('XXXX')).toBeNull();
  });
});
