/**
 * AVG 舞台背景冷暖判定与气泡文字反差样式。
 * 暖色背景 → 冷色字；冷色背景 → 暖色字，提升毛玻璃气泡可读性。
 */

export type AvgBgTone = 'warm' | 'cool' | 'neutral';

/** 根据 RGB 均值判定冷暖（用于 canvas 采样或测试） */
export function classifyRgb(r: number, g: number, b: number): AvgBgTone {
  const warmth = r - b + (r - g) * 0.35;
  if (warmth > 22) return 'warm';
  if (warmth < -22) return 'cool';
  return 'neutral';
}

/** 无背景图时，从 Tailwind 渐变类名推断冷暖 */
export function toneFromGradient(gradientClassName: string): AvgBgTone {
  const g = gradientClassName.toLowerCase();
  if (/amber|orange|yellow|rose|red|warm/.test(g)) return 'warm';
  if (/indigo|blue|slate|teal|emerald|cyan|violet|sky|green/.test(g)) return 'cool';
  return 'neutral';
}

/** 舞台冷暖 → 气泡内文字/边框取反色温 */
export const BUBBLE_TEXT_BY_TONE: Record<
  AvgBgTone,
  { body: string; label: string; narratorBorder: string }
> = {
  warm: {
    body: 'text-slate-800',
    label: 'text-slate-600',
    narratorBorder: 'border-slate-400/50',
  },
  cool: {
    body: 'text-stone-900',
    label: 'text-amber-950/80',
    narratorBorder: 'border-stone-400/50',
  },
  neutral: {
    body: 'text-foreground',
    label: 'text-muted-foreground',
    narratorBorder: 'border-border/60',
  },
};

/**
 * 在浏览器中采样背景图底部区域（气泡所在位置）并判定冷暖。
 */
export async function sampleImageTone(imageUrl: string): Promise<AvgBgTone> {
  if (typeof window === 'undefined') return 'neutral';

  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const w = Math.min(img.naturalWidth, 320);
        const h = Math.min(img.naturalHeight, 240);
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('neutral');
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const y0 = Math.floor(h * 0.55);
        const x0 = Math.floor(w * 0.1);
        const sw = Math.max(1, Math.floor(w * 0.8));
        const sh = Math.max(1, h - y0);
        const { data } = ctx.getImageData(x0, y0, sw, sh);
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i] ?? 0;
          g += data[i + 1] ?? 0;
          b += data[i + 2] ?? 0;
          count++;
        }
        if (count === 0) {
          resolve('neutral');
          return;
        }
        resolve(classifyRgb(r / count, g / count, b / count));
      } catch {
        resolve('neutral');
      }
    };
    img.onerror = () => resolve('neutral');
    img.src = imageUrl;
  });
}
