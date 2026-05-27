/**
 * AVG 舞台容器：全屏感背景渐变 + 可选图片层 + 内容安全区内嵌子组件。
 * T2.6 支持结构化背景描述符（渐变 + 图片/Lottie）。
 * 2026-05-24 采样背景冷暖，向子组件提供反差文字色调 Context。
 */
'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';

import { AvgStageToneProvider } from '@/components/avg-test/avg-stage-tone-context';
import { useAvgBackgroundTone } from '@/hooks/use-avg-background-tone';
import type { BackgroundDescriptor } from '@/lib/avg-script';
import { cn } from '@/lib/utils';

type AvgStoryStageProps = {
  /** 旧版渐变类名（向后兼容） */
  backgroundClassName?: string;
  /** T2.6 结构化背景描述符（优先级高于 backgroundClassName） */
  background?: BackgroundDescriptor;
  children: ReactNode;
};

export function AvgStoryStage({ backgroundClassName, background, children }: AvgStoryStageProps) {
  const descriptor: BackgroundDescriptor = background ?? {
    gradientClassName: backgroundClassName ?? 'from-slate-900 to-slate-950',
  };
  const tone = useAvgBackgroundTone(descriptor);

  return (
    <AvgStageToneProvider tone={tone}>
      <div
        className={cn(
          'relative min-h-[min(70vh,560px)] overflow-hidden rounded-3xl border-[3px] border-[var(--border)]/50 shadow-clay-lg',
        )}
      >
        <div className={cn('absolute inset-0 bg-gradient-to-b', descriptor.gradientClassName)} />

        {descriptor.imageUrl && (
          <Image
            src={descriptor.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority={false}
          />
        )}

        <div className="relative z-10 flex min-h-[min(70vh,560px)] flex-col justify-end gap-6 p-4 sm:p-8">
          {children}
        </div>
      </div>
    </AvgStageToneProvider>
  );
}
