/**
 * 海报 Canvas 渲染单元测试（T4.2，mock Canvas 与 qrcode）。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderPosterToCanvas } from '@/lib/poster-canvas';
import {
  POSTER_EXPORT_SCALE,
  POSTER_LOGICAL_HEIGHT,
  POSTER_LOGICAL_WIDTH,
  type PosterInput,
} from '@/lib/poster-types';

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,AAAA'),
  },
}));

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = 320;
  height = 320;
  set src(_v: string) {
    queueMicrotask(() => this.onload?.());
  }
}

function createMockContext() {
  const gradient = { addColorStop: vi.fn() };
  return {
    scale: vi.fn(),
    fillStyle: '',
    fillRect: vi.fn(),
    font: '',
    textAlign: 'left',
    fillText: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    roundRect: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
  };
}

describe('renderPosterToCanvas', () => {
  beforeEach(() => {
    vi.stubGlobal('Image', MockImage);
    const mockCtx = createMockContext();
    vi.stubGlobal('document', {
      createElement: (tag: string) => {
        if (tag !== 'canvas') {
          return { tagName: tag };
        }
        return {
          width: 0,
          height: 0,
          getContext: () => mockCtx,
          toBlob: (cb: (b: Blob | null) => void) => cb(new Blob(['x'], { type: 'image/png' })),
        };
      },
    } as unknown as Document);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('返回带 2× 导出尺寸的 canvas 元素', async () => {
    const input: PosterInput = {
      mode: 'STANDARD',
      result: {
        mode: 'STANDARD',
        mbti_type: 'INFP',
        scores: {
          EI: { E: 2, I: 8, winner: 'I', delta: 6 },
          SN: { S: 3, N: 7, winner: 'N', delta: 4 },
          TF: { T: 4, F: 7, winner: 'F', delta: 3 },
          JP: { J: 5, P: 6, winner: 'P', delta: 1 },
        },
      },
      generated_at: '2026-05-17T00:00:00.000Z',
      nickname: '星尘#921',
      origin: 'https://example.com',
    };
    const canvas = await renderPosterToCanvas(input);
    expect(canvas.width).toBe(POSTER_LOGICAL_WIDTH * POSTER_EXPORT_SCALE);
    expect(canvas.height).toBe(POSTER_LOGICAL_HEIGHT * POSTER_EXPORT_SCALE);
  });
});
