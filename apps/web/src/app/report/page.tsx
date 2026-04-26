/**
 * 结果报告页：读取最近一次测评结果快照，渲染 MBTI 类型、精灵卡、雷达图与详细解析。
 */
'use client';

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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">结果报告</h1>
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
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
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">结果报告 · {snapshot.mode}</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {snapshot.result.mbti_type}
        </h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SpriteProfileCard mbtiType={snapshot.result.mbti_type} />
        <MbtiRadarCard scores={snapshot.result.scores} />
      </div>
      <MbtiAnalysisCard mbtiType={snapshot.result.mbti_type} />
    </div>
  );
}
