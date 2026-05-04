/**
 * 标准模式单题卡片容器：题干与选项区占位，与深色/浅色主题变量一致。
 * 2026-05-01 UI 重构：Claymorphism 粘土风格 — rounded-3xl, 3px border, shadow-clay。
 */
import type { ReactNode } from 'react';

type StandardQuestionCardProps = {
  /** 如「第 3 / 12 题」 */
  indexLabel: string;
  children: ReactNode;
};

export function StandardQuestionCard({ indexLabel, children }: StandardQuestionCardProps) {
  return (
    <div className="rounded-3xl border-[3px] border-[var(--border)] bg-card p-6 text-card-foreground shadow-clay sm:p-8">
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {indexLabel}
      </p>
      <div className="space-y-6">{children}</div>
    </div>
  );
}
