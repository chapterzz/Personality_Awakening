/**
 * AVG 舞台容器：上方全幅场景背景图，下方独立剧情区（对白/选项不遮挡背景）。
 * T2.6 支持结构化背景描述符（渐变 + 图片）；背景冷暖采样供子组件可选反差色。
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
          'overflow-hidden rounded-3xl border-[3px] border-[var(--border)]/50 shadow-clay-lg',
        )}
      >
        <div
          className="relative aspect-[16/10] w-full min-h-[200px] max-h-[min(52vh,440px)] bg-muted"
          aria-hidden
        >
          <div className={cn('absolute inset-0 bg-gradient-to-b', descriptor.gradientClassName)} />
          {descriptor.imageUrl ? (
            <Image
              src={descriptor.imageUrl}
              alt=""
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 768px"
              priority={false}
            />
          ) : null}
        </div>

        <div className="border-t-2 border-[var(--border)]/50 bg-card p-4 sm:p-6">{children}</div>
      </div>
    </AvgStageToneProvider>
  );
}
