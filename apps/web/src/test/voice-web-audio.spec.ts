/**
 * Web Audio 语音引擎单元测试（T4.3，mock AudioContext）。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { VoiceAudioLoadError, createVoiceWebAudioEngine } from '@/lib/voice-web-audio';

describe('createVoiceWebAudioEngine', () => {
  const decodeAudioData = vi.fn();
  const resume = vi.fn().mockResolvedValue(undefined);
  const close = vi.fn().mockResolvedValue(undefined);
  const connect = vi.fn();
  const start = vi.fn();
  const stop = vi.fn();
  const createBufferSource = vi.fn(() => ({
    connect,
    start,
    stop,
    onended: null as (() => void) | null,
    buffer: null as AudioBuffer | null,
  }));

  const mockContext = {
    decodeAudioData,
    resume,
    close,
    createBufferSource,
    destination: {},
    state: 'suspended' as AudioContextState,
  };

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      }),
    );
    decodeAudioData.mockReset();
    decodeAudioData.mockResolvedValue({ duration: 1 } as AudioBuffer);
    createBufferSource.mockClear();
    resume.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loadAndPlay 会 resume、decode 并 createBufferSource', async () => {
    const engine = createVoiceWebAudioEngine(() => mockContext as unknown as AudioContext);
    await engine.loadAndPlay('/audio/voice/INFP.mp3');

    expect(resume).toHaveBeenCalled();
    expect(decodeAudioData).toHaveBeenCalled();
    expect(createBufferSource).toHaveBeenCalled();
    expect(start).toHaveBeenCalledWith(0);
  });

  it('fetch 失败时抛出 VoiceAudioLoadError', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 404 } as Response);
    const engine = createVoiceWebAudioEngine(() => mockContext as unknown as AudioContext);

    await expect(engine.loadAndPlay('/missing.mp3')).rejects.toBeInstanceOf(VoiceAudioLoadError);
  });

  it('dispose 会 close AudioContext', async () => {
    const engine = createVoiceWebAudioEngine(() => mockContext as unknown as AudioContext);
    await engine.resume();
    engine.dispose();
    expect(close).toHaveBeenCalled();
  });
});
