/**
 * media-preload 工具单测：验证图片和音频预加载的 Promise 行为。
 */
import { describe, expect, it, vi } from 'vitest';

import { preloadAudio, preloadImage } from './media-preload';

describe('preloadImage', () => {
  it('图片加载成功时 resolve', async () => {
    const onloadRef = { onload: null as (() => void) | null };
    vi.stubGlobal(
      'Image',
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_val: string) {
          onloadRef.onload = this.onload;
        }
      },
    );

    const promise = preloadImage('/test.png');
    onloadRef.onload?.();
    await expect(promise).resolves.toBeUndefined();

    vi.unstubAllGlobals();
  });

  it('图片加载失败时 reject', async () => {
    const onerrorRef = { onerror: null as (() => void) | null };
    vi.stubGlobal(
      'Image',
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_val: string) {
          onerrorRef.onerror = this.onerror;
        }
      },
    );

    const promise = preloadImage('/bad.png');
    onerrorRef.onerror?.();
    await expect(promise).rejects.toThrow('Failed to preload image: /bad.png');

    vi.unstubAllGlobals();
  });
});

describe('preloadAudio', () => {
  it('音频可播放时 resolve', async () => {
    const canplayRef = { handler: null as (() => void) | null };
    vi.stubGlobal(
      'Audio',
      class {
        oncanplaythrough: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_val: string) {
          canplayRef.handler = this.oncanplaythrough;
        }
      },
    );

    const promise = preloadAudio('/test.mp3');
    canplayRef.handler?.();
    await expect(promise).resolves.toBeUndefined();

    vi.unstubAllGlobals();
  });

  it('音频加载失败时 reject', async () => {
    const onerrorRef = { handler: null as (() => void) | null };
    vi.stubGlobal(
      'Audio',
      class {
        oncanplaythrough: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_val: string) {
          onerrorRef.handler = this.onerror;
        }
      },
    );

    const promise = preloadAudio('/bad.mp3');
    onerrorRef.handler?.();
    await expect(promise).rejects.toThrow('Failed to preload audio: /bad.mp3');

    vi.unstubAllGlobals();
  });
});
