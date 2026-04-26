/**
 * 标准模式测评页（客户端）：演示题库 + 进度条/题卡/选项 + 每 5 题保存与 409 处理。
 */
'use client';

import { SpriteBubble } from '@/components/sprite/sprite-bubble';
import { StandardOptionButtons } from '@/components/standard-test/standard-option-buttons';
import { StandardQuestionCard } from '@/components/standard-test/standard-question-card';
import { StandardTestProgressBar } from '@/components/standard-test/standard-test-progress-bar';
import { Button, buttonVariants } from '@/components/ui/button';
import { getHesitationLine, getMutexLine } from '@/data/sprite-lines';
import { DEMO_STANDARD_CONFIG } from '@/data/standard-demo-questionnaire';
import { useSpriteInteraction } from '@/hooks/use-sprite-interaction';
import { useStandardTest } from '@/hooks/use-standard-test';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useEffect } from 'react';

export function StandardTestClient() {
  const t = useStandardTest(DEMO_STANDARD_CONFIG);
  const sprite = useSpriteInteraction({
    getHesitationLine,
    getMutexLine,
  });

  const q = t.currentQuestion;
  const choiceActive = t.phase === 'ready' && !t.isComplete && Boolean(q) && !t.saving;
  const choiceContextId = q?.id ?? 'standard-none';

  useEffect(() => {
    sprite.setChoiceContext({ contextId: choiceContextId, active: choiceActive });
  }, [choiceActive, choiceContextId, sprite]);

  if (t.phase === 'loading') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        加载进度…
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
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 w-[min(92vw,420px)]">
        {sprite.prompt && (
          <SpriteBubble text={sprite.prompt.text} onClose={() => sprite.dismissPrompt()} />
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">标准模式 · 演示问卷</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">性格倾向小测</h1>
        <p className="text-sm text-muted-foreground">
          每次作答都会自动同步服务端进度（含登录后续答）。当前身份：
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
          <p className="mt-2 text-sm text-muted-foreground">
            你可以重新开始一轮测试。重新开始将丢弃当前测试结果。
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              type="button"
              disabled={t.saving}
              onClick={() => {
                const ok = window.confirm('重新开始将丢弃当前测试结果，确定重新开始吗？');
                if (ok) {
                  void t.restart();
                }
              }}
            >
              重新开始
            </Button>
            <span className="w-3" />
            <Link className={cn(buttonVariants(), 'inline-flex')} href="/">
              返回首页
            </Link>
          </div>
        </div>
      )}

      {!t.isComplete && q && (
        <StandardQuestionCard indexLabel={`第 ${displayNum} / ${t.totalQuestions} 题`}>
          <p className="text-lg font-medium leading-relaxed text-foreground">{q.text}</p>
          <StandardOptionButtons
            options={q.options}
            disabled={t.saving}
            onSelect={(id) => {
              const opt = q.options.find((o) => o.id === id);
              if (opt) {
                sprite.recordChoice(
                  { dimension: opt.dimension, side: opt.side, weight: opt.weight },
                  q.id,
                );
              }
              void t.selectOption(id);
            }}
          />
        </StandardQuestionCard>
      )}

      {!t.isComplete && !q && (
        <p className="text-sm text-destructive">当前题目配置缺失，请刷新页面或联系管理员。</p>
      )}

      <p className="text-xs text-muted-foreground">
        修订号 {t.revision}（调试） · 登录后续答请将 JWT 存入{' '}
        <code className="rounded bg-muted px-1">localStorage.ppa_access_token</code>
      </p>
    </div>
  );
}
