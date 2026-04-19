/**
 * 标准模式测评页（客户端）：演示题库 + 进度条/题卡/选项 + 每 5 题保存与 409 处理。
 */
'use client';

import { StandardOptionButtons } from '@/components/standard-test/standard-option-buttons';
import { StandardQuestionCard } from '@/components/standard-test/standard-question-card';
import { StandardTestProgressBar } from '@/components/standard-test/standard-test-progress-bar';
import { Button, buttonVariants } from '@/components/ui/button';
import { DEMO_STANDARD_CONFIG } from '@/data/standard-demo-questionnaire';
import { useStandardTest } from '@/hooks/use-standard-test';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function StandardTestClient() {
  const t = useStandardTest(DEMO_STANDARD_CONFIG);

  if (t.phase === 'loading') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        加载进度…
      </div>
    );
  }

  if (t.phase === 'wrong_mode') {
    return (
      <div className="space-y-4 rounded-xl border border-amber-500/40 bg-amber-500/5 p-6">
        <p className="font-medium text-foreground">当前会话为 AVG 剧情进度</p>
        <p className="text-sm text-muted-foreground">
          进行中的 AVG 与标准测评共用同一条会话。请先继续或完成 AVG，再体验标准测评。
        </p>
        <Link className={cn(buttonVariants())} href="/test/avg">
          前往 AVG 演示
        </Link>
      </div>
    );
  }

  if (t.phase === 'error') {
    return (
      <div className="space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <p className="font-medium text-destructive">无法加载测评进度</p>
        <p className="text-sm text-muted-foreground">{t.loadError}</p>
        <Button type="button" onClick={() => t.reload()}>
          重试
        </Button>
      </div>
    );
  }

  const ordered = t.progressData?.standard.ordered_question_ids ?? [
    ...DEMO_STANDARD_CONFIG.orderedQuestionIds,
  ];
  const idx = t.progressData?.standard.current_index ?? 0;
  const displayNum = Math.min(idx + 1, ordered.length);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">标准模式 · 演示问卷</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">性格倾向小测</h1>
        <p className="text-sm text-muted-foreground">
          进度将每答满 5 题自动同步服务端（含登录后续答）。当前身份：
          <span className="ml-1 font-medium text-foreground">
            {t.authMode === 'user' ? '已登录（Bearer）' : '游客（session_id）'}
          </span>
        </p>
      </div>

      <StandardTestProgressBar answered={t.answeredCount} total={t.totalQuestions} />

      {t.conflictNotice && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
          检测到其他端已更新进度，已为你同步为服务器最新版本。
        </p>
      )}

      {t.saveError && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <span>{t.saveError}</span>
          <button
            type="button"
            className={cn(buttonVariants({ variant: 'outline', size: 'xs' }))}
            onClick={() => t.clearSaveError()}
          >
            知道了
          </button>
        </div>
      )}

      {t.saving && <p className="text-sm text-muted-foreground">正在保存…</p>}

      {t.isComplete && (
        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-foreground">本卷已完成</p>
          <p className="mt-2 text-sm text-muted-foreground">
            演示流程结束。正式提交与报告将在后续里程碑接入。
          </p>
          <Link className={cn(buttonVariants(), 'mt-6 inline-flex')} href="/">
            返回首页
          </Link>
        </div>
      )}

      {!t.isComplete && t.currentQuestion && (
        <StandardQuestionCard indexLabel={`第 ${displayNum} / ${t.totalQuestions} 题`}>
          <p className="text-lg font-medium leading-relaxed text-foreground">
            {t.currentQuestion.text}
          </p>
          <StandardOptionButtons
            options={t.currentQuestion.options}
            disabled={t.saving}
            onSelect={(id) => void t.selectOption(id)}
          />
        </StandardQuestionCard>
      )}

      {!t.isComplete && !t.currentQuestion && (
        <p className="text-sm text-destructive">当前题目配置缺失，请刷新页面或联系管理员。</p>
      )}

      <p className="text-xs text-muted-foreground">
        修订号 {t.revision}（调试） · 登录后续答请将 JWT 存入{' '}
        <code className="rounded bg-muted px-1">localStorage.ppa_access_token</code>
      </p>
    </div>
  );
}
