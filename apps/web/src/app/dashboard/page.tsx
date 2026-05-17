/**
 * 全局洞察看板页面：公开访问，展示所有用户测评结果的汇总统计。
 * 包含类型分布条形图、精灵热力图、趣味数据卡片和个人对比区。
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardHero } from '@/components/dashboard/dashboard-hero';
import { TypeDistributionChart } from '@/components/dashboard/type-distribution-chart';
import { SpriteHeatmap } from '@/components/dashboard/sprite-heatmap';
import { FunInsightCards } from '@/components/dashboard/fun-insight-cards';
import { PersonalComparison } from '@/components/dashboard/personal-comparison';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DashboardStats, MyComparison } from '@/lib/dashboard-api';
import { fetchDashboardStats, fetchMyComparison } from '@/lib/dashboard-api';
import { getAccessToken } from '@/lib/auth-token';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [comparison, setComparison] = useState<MyComparison | null>(null);
  const [authHint, setAuthHint] = useState<'guest' | 'no_result' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '加载失败'));

    fetchMyComparison()
      .then((data) => {
        setComparison(data);
        if (!getAccessToken()) {
          setAuthHint('guest');
        } else if (!data) {
          setAuthHint('no_result');
        } else {
          setAuthHint(null);
        }
      })
      .catch(() => {
        if (!getAccessToken()) setAuthHint('guest');
      });
  }, []);

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <Link
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex w-fit')}
          href="/"
        >
          返回首页
        </Link>
        <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-950 dark:text-red-100">
          加载看板数据失败：{error}
        </p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="mx-auto flex w-full max-w-4xl items-center justify-center py-20">
        <p className="text-muted-foreground">加载中…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Link
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex w-fit')}
        href="/"
      >
        返回首页
      </Link>

      <DashboardHero totalUsers={stats.totalUsers} />

      {authHint === 'guest' ? (
        <p className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          登录后可高亮你在柱状图中的 MBTI 类型并查看个人对比。
          <Link
            className={cn(
              buttonVariants({ variant: 'link', size: 'sm' }),
              'ml-1 inline h-auto p-0',
            )}
            href="/login?redirect=/dashboard"
          >
            去登录 / 注册
          </Link>
        </p>
      ) : null}
      {authHint === 'no_result' ? (
        <p className="rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          已登录但尚无测评结果。请使用注册页的「写入演示测评结果」，或使用 Seed 演示账号登录。
          <Link
            className={cn(
              buttonVariants({ variant: 'link', size: 'sm' }),
              'ml-1 inline h-auto p-0',
            )}
            href="/login?redirect=/dashboard"
          >
            注册 / 切换账号
          </Link>
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <TypeDistributionChart data={stats.typeDistribution} highlightType={comparison?.myType} />
        <SpriteHeatmap data={stats.spriteHeatmap} />
      </div>

      <FunInsightCards insights={stats.funInsights} />

      <PersonalComparison comparison={comparison} />
    </div>
  );
}
