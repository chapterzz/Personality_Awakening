/**
 * AVG 舞台容器：全屏感背景渐变 + 内容安全区内嵌子组件。
 */
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type AvgStoryStageProps = {
  backgroundClassName: string;
  children: ReactNode;
};

export function AvgStoryStage({ backgroundClassName, children }: AvgStoryStageProps) {
  return (
    <div
      className={cn(
        'relative min-h-[min(70vh,560px)] overflow-hidden rounded-2xl border border-border/50 shadow-lg',
        'bg-gradient-to-b',
        backgroundClassName,
      )}
    >
      <div className="relative z-10 flex min-h-[min(70vh,560px)] flex-col justify-end gap-6 p-4 sm:p-8">
        {children}
      </div>
    </div>
  );
}
