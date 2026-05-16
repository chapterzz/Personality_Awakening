/**
 * 个人对比区：仅登录用户可见，展示自己的人格类型与全局数据对比。
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
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] text-xl font-black text-white shadow-clay-sm">
          {myType}
        </div>
        <div>
          <p className="text-base font-display font-bold text-foreground">你是 {myType} 类型</p>
          <p className="text-sm text-muted-foreground">
            全球有 <span className="font-bold text-foreground">{typePercentage}%</span>{' '}
            的人也是这个类型
          </p>
          <p className="text-sm text-muted-foreground">
            在所有类型中排名第 <span className="font-bold text-foreground">{typeRank}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
