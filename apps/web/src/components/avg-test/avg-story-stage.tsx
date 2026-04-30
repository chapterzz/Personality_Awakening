/**
 * AVG 舞台容器：全屏感背景渐变 + 可选图片层 + 内容安全区内嵌子组件。
 * T2.6 支持结构化背景描述符（渐变 + 图片/Lottie）。
 */
import Image from 'next/image';
import type { ReactNode } from 'react';

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
  // 优先使用结构化 descriptor，回退到旧版渐变类名
  const descriptor: BackgroundDescriptor = background ?? {
    gradientClassName: backgroundClassName ?? 'from-slate-900 to-slate-950',
  };

  return (
    <div
      className={cn(
        'relative min-h-[min(70vh,560px)] overflow-hidden rounded-2xl border border-border/50 shadow-lg',
      )}
    >
      {/* 渐变层：始终作为 base/fallback */}
      <div className={cn('absolute inset-0 bg-gradient-to-b', descriptor.gradientClassName)} />

      {/* 图片层：当 imageUrl 存在时叠加 */}
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

      {/* 内容层 */}
      <div className="relative z-10 flex min-h-[min(70vh,560px)] flex-col justify-end gap-6 p-4 sm:p-8">
        {children}
      </div>
    </div>
  );
}
