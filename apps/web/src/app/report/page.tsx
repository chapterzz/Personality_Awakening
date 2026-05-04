/**
 * 结果报告页：读取最近一次测评结果快照，渲染 MBTI 类型、精灵卡、雷达图与详细解析。
 * 2026-05-01 UI 重构：font-display 标题 + 渐变 Hero 区域 + 浮动 blob。
 */
'use client';

import { FloatingBlobs } from '@/components/decorative/floating-blobs';
import { MbtiAnalysisCard } from '@/components/report/mbti-analysis-card';
import { MbtiRadarCard } from '@/components/report/mbti-radar-card';
import { SpriteProfileCard } from '@/components/report/sprite-profile-card';
import { buttonVariants } from '@/components/ui/button';
import { loadReportSnapshot } from '@/lib/report-storage';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ReportPage() {
  const snapshot = loadReportSnapshot();

  if (!snapshot) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          结果报告
        </h1>
        <p className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
          未找到最近一次测评结果，请先完成标准模式或 AVG 模式测评。
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            className={cn(buttonVariants({ variant: 'outline' }), 'inline-flex')}
            href="/test/standard"
          >
            去标准模式
          </Link>
          <Link className={cn(buttonVariants(), 'inline-flex')} href="/test/avg">
            去 AVG 模式
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      {/* MBTI 类型 Hero 区域 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 to-[#A78BFA]/10 p-6 dark:from-primary/5 dark:to-[#A78BFA]/5">
        <FloatingBlobs variant="light" />
        <div className="relative z-10 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">结果报告 · {snapshot.mode}</p>
          <h1 className="font-display text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            {snapshot.result.mbti_type}
          </h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SpriteProfileCard mbtiType={snapshot.result.mbti_type} />
        <MbtiRadarCard scores={snapshot.result.scores} />
      </div>
      <MbtiAnalysisCard mbtiType={snapshot.result.mbti_type} />
    </div>
  );
}
