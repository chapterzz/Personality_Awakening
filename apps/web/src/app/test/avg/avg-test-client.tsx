/**
 * AVG 演示页（客户端）：剧情渲染、背景切换、分支选项、节点级保存与 409 处理（T2.2）。
 */
'use client';

import { AvgDialogueBubbles } from '@/components/avg-test/avg-dialogue-bubbles';
import { AvgOptionButtons } from '@/components/avg-test/avg-option-buttons';
import { AvgStoryProgressBar } from '@/components/avg-test/avg-story-progress-bar';
import { AvgStoryStage } from '@/components/avg-test/avg-story-stage';
import { SpriteBubble } from '@/components/sprite/sprite-bubble';
import { Button, buttonVariants } from '@/components/ui/button';
import { DEMO_AVG_SCRIPT } from '@/data/avg-demo-script';
import { getHesitationLine, getMutexLine } from '@/data/sprite-lines';
import { useAvgTest } from '@/hooks/use-avg-test';
import { useSpriteInteraction } from '@/hooks/use-sprite-interaction';
import { getBackgroundClassName } from '@/lib/avg-script';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useEffect } from 'react';

export function AvgTestClient() {
  const t = useAvgTest(DEMO_AVG_SCRIPT);
  const sprite = useSpriteInteraction({
    getHesitationLine,
    getMutexLine,
  });

  const isChoiceNode = Boolean(t.currentNode && !t.isComplete && t.currentNode.kind === 'choice');
  const choiceActive = t.phase === 'ready' && isChoiceNode && !t.saving;
  const choiceContextId = t.progressData?.avg.node_id ?? 'avg-none';

  useEffect(() => {
    sprite.setChoiceContext({ contextId: choiceContextId, active: choiceActive });
  }, [choiceActive, choiceContextId, sprite]);

  if (t.phase === 'loading') {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div>
          <Link className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))} href="/">
            返回首页
          </Link>
        </div>
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          加载剧情进度…
        </div>
      </div>
    );
  }

  if (t.phase === 'script_mismatch') {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div>
          <Link className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))} href="/">
            返回首页
          </Link>
        </div>
        <div className="space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="font-medium text-destructive">剧情版本不一致</p>
          <p className="text-sm text-muted-foreground">
            服务器上的 AVG 进度不属于本演示脚本（{DEMO_AVG_SCRIPT.script_id}
            ）。请在正式流程中续答，或联系管理员清理进行中会话。
          </p>
        </div>
      </div>
    );
  }

  if (t.phase === 'error') {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div>
          <Link className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))} href="/">
            返回首页
          </Link>
        </div>
        <div className="space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="font-medium text-destructive">无法加载剧情进度</p>
          <p className="text-sm text-muted-foreground">{t.loadError}</p>
          <Button type="button" onClick={() => t.reload()}>
            重试
          </Button>
        </div>
      </div>
    );
  }

  const bg = t.currentNode
    ? getBackgroundClassName(DEMO_AVG_SCRIPT, t.currentNode.background_key)
    : getBackgroundClassName(DEMO_AVG_SCRIPT, 'night');

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))} href="/">
          返回首页
        </Link>
      </div>
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 w-[min(92vw,420px)]">
        {sprite.prompt && (
          <SpriteBubble text={sprite.prompt.text} onClose={() => sprite.dismissPrompt()} />
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">AVG 模式 · 演示剧情</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">星港夜话</h1>
        <p className="text-sm text-muted-foreground">
          每个节点确认后写入服务端（含登录后续答）。当前身份：
          <span className="ml-1 font-medium text-foreground">
            {t.authMode === 'user' ? '已登录（Bearer）' : '游客（session_id）'}
          </span>
        </p>
      </div>

      <AvgStoryProgressBar stepIndex={t.stepIndex} totalSteps={t.totalSteps} />

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

      <AvgStoryStage backgroundClassName={bg}>
        {!t.currentNode && (
          <p className="text-sm text-destructive">当前节点配置缺失，请刷新页面。</p>
        )}

        {t.currentNode && t.isComplete && (
          <div className="rounded-xl border border-border/60 bg-background/90 p-6 shadow-sm backdrop-blur-md">
            <AvgDialogueBubbles lines={t.currentNode.lines} />
            <p className="mt-6 text-center text-sm font-medium text-foreground">本段剧情已完成</p>
            <p className="mt-2 text-center text-sm text-muted-foreground">
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
              <Link className={cn(buttonVariants())} href="/">
                返回首页
              </Link>
            </div>
          </div>
        )}

        {t.currentNode && !t.isComplete && t.currentNode.kind === 'dialogue' && (
          <div className="rounded-xl border border-border/60 bg-background/90 p-6 shadow-sm backdrop-blur-md">
            <AvgDialogueBubbles lines={t.currentNode.lines} />
            <div className="mt-6 flex justify-end">
              <Button type="button" disabled={t.saving} onClick={() => void t.continueDialogue()}>
                继续
              </Button>
            </div>
          </div>
        )}

        {t.currentNode && !t.isComplete && t.currentNode.kind === 'choice' && (
          <div className="rounded-xl border border-border/60 bg-background/90 p-6 shadow-sm backdrop-blur-md">
            <AvgDialogueBubbles lines={t.currentNode.lines} />
            <div className="mt-6">
              <AvgOptionButtons
                options={t.currentNode.options}
                disabled={t.saving}
                onSelect={(id) => {
                  const opt =
                    t.currentNode?.kind === 'choice'
                      ? t.currentNode.options.find((o) => o.id === id)
                      : undefined;
                  if (opt?.dimension != null && opt.side != null && opt.weight != null) {
                    sprite.recordChoice(
                      { dimension: opt.dimension, side: opt.side, weight: opt.weight },
                      t.progressData?.avg.node_id,
                    );
                  }
                  void t.selectOption(id);
                }}
              />
            </div>
          </div>
        )}
      </AvgStoryStage>

      <p className="text-xs text-muted-foreground">
        修订号 {t.revision}（调试） · 登录后续答请将 JWT 存入{' '}
        <code className="rounded bg-muted px-1">localStorage.ppa_access_token</code>
      </p>
    </div>
  );
}
