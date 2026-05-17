/**
 * 个人对比区：仅登录且有测评结果时展示；徽章 P-A（紫渐变圆 + chart-3 描边）。
 */
'use client';

import type { MyComparison } from '@/lib/dashboard-api';

export function PersonalComparison(props: { comparison: MyComparison | null }) {
  if (!props.comparison) return null;

  const { myType, typePercentage, typeRank } = props.comparison;

  return (
    <section className="rounded-3xl border-[3px] border-[var(--border)] bg-gradient-to-br from-primary/5 to-[#A78BFA]/5 p-6 shadow-clay">
      <h2 className="text-lg font-display font-bold text-foreground">你的位置</h2>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] text-xl font-black text-white shadow-clay-sm ring-2 ring-[var(--chart-3)]/40"
          aria-hidden
        >
          {myType}
        </div>
        <div>
          <p className="text-base font-display font-bold text-foreground">你是 {myType} 类型</p>
          <p className="text-sm text-muted-foreground">
            全体探索者中 <span className="font-bold text-foreground">{typePercentage}%</span>{' '}
            与你是同一类型
          </p>
          <p className="text-sm text-muted-foreground">
            人数排名第 <span className="font-bold text-foreground">{typeRank}</span> 位（共 16 型）
          </p>
        </div>
      </div>
    </section>
  );
}
