/**
 * 根据 AVG 舞台背景（图片采样或渐变类名）推断冷暖，供气泡文字反差着色。
 */
'use client';

import { useEffect, useState } from 'react';

import type { BackgroundDescriptor } from '@/lib/avg-script';
import { type AvgBgTone, sampleImageTone, toneFromGradient } from '@/lib/avg-background-tone';

/**
 * @param background 当前舞台背景描述符
 * @returns 背景冷暖：`warm` | `cool` | `neutral`
 */
export function useAvgBackgroundTone(background: BackgroundDescriptor | undefined): AvgBgTone {
  const [tone, setTone] = useState<AvgBgTone>('neutral');
  const gradientClassName = background?.gradientClassName ?? '';
  const imageUrl = background?.imageUrl;

  useEffect(() => {
    const gradientTone = toneFromGradient(gradientClassName);

    if (!imageUrl) {
      setTone(gradientTone);
      return;
    }

    let cancelled = false;
    void sampleImageTone(imageUrl).then((imageTone) => {
      if (cancelled) return;
      setTone(imageTone !== 'neutral' ? imageTone : gradientTone);
    });

    return () => {
      cancelled = true;
    };
  }, [gradientClassName, imageUrl]);

  return tone;
}
