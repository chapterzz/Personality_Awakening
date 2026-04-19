/**
 * 标准模式单题卡片容器：题干与选项区占位，与深色/浅色主题变量一致。
 */
import type { ReactNode } from 'react';

type StandardQuestionCardProps = {
  /** 如「第 3 / 12 题」 */
  indexLabel: string;
  children: ReactNode;
};

export function StandardQuestionCard({ indexLabel, children }: StandardQuestionCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-8">
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {indexLabel}
      </p>
      <div className="space-y-6">{children}</div>
    </div>
  );
}
