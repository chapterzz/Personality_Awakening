/**
 * 看板顶部 Hero 区域：标题与总参与人数。
 */
'use client';

import { FloatingBlobs } from '@/components/decorative/floating-blobs';

export function DashboardHero(props: { totalUsers: number }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 to-[#A78BFA]/10 p-6 dark:from-primary/5 dark:to-[#A78BFA]/5">
      <FloatingBlobs variant="light" />
      <div className="relative z-10 space-y-2">
        <p className="text-sm font-medium text-muted-foreground">全局洞察</p>
        <h1 className="font-display text-4xl font-black tracking-tight text-foreground sm:text-5xl">
          性格星球 · 全局洞察
        </h1>
        <p className="text-base text-muted-foreground">
          已有 <span className="font-bold text-foreground">{props.totalUsers}</span>{' '}
          位探索者完成测评
        </p>
      </div>
    </div>
  );
}
