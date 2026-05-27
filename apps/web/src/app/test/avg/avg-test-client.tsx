/**
 * AVG 演示页（客户端）：剧情渲染、背景切换、分支选项、节点级保存与 409 处理（T2.2）。
 * T4.7：mount 时从 API 拉取已发布脚本与精灵文案。
 */
'use client';

import { AvgDialogueBubbles } from '@/components/avg-test/avg-dialogue-bubbles';
import { AvgOptionButtons } from '@/components/avg-test/avg-option-buttons';
import { AvgStoryProgressBar } from '@/components/avg-test/avg-story-progress-bar';
import { AvgStoryStage } from '@/components/avg-test/avg-story-stage';
import { SpriteBubble } from '@/components/sprite/sprite-bubble';
import { Button, buttonVariants } from '@/components/ui/button';
import type { AvgScriptConfig } from '@/data/avg-demo-script';
import { DEMO_AVG_SCRIPT_ID } from '@/data/avg-demo-script';
import { getHesitationLine, getMutexLine } from '@/data/sprite-lines';
import { useAvgTest } from '@/hooks/use-avg-test';
import { useSpriteInteraction } from '@/hooks/use-sprite-interaction';
import { fetchPublishedAvgScript } from '@/lib/avg-script-api';
import { getBackgroundDescriptor } from '@/lib/avg-script';
import { buildAvgSignals, fetchMbtiReport, ReportScoringError } from '@/lib/report-scoring';
import { saveReportSnapshot } from '@/lib/report-storage';
import { createSpriteLineGetters, fetchPublishedSpritePrompts } from '@/lib/sprite-prompt-api';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type SpriteLineGetters = {
  getHesitationLine: () => string;
  getMutexLine: (d: import('@/lib/sprite-interaction').DimensionTag) => string;
};

type AvgTestRunnerProps = {
  config: AvgScriptConfig;
  spriteGetters: SpriteLineGetters;
};

/** 已加载脚本与文案后的 AVG 主流程（Hooks 须在此层调用） */
function AvgTestRunner({ config, spriteGetters }: AvgTestRunnerProps) {
  const t = useAvgTest(config);
  const router = useRouter();
  const sprite = useSpriteInteraction(spriteGetters);
  const [buildingReport, setBuildingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

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
        <div className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="font-medium text-destructive">剧情版本不一致</p>
          <p className="text-sm text-muted-foreground">
            服务器上的 AVG 进度不属于本演示脚本（{config.script_id}
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
        <div className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="font-medium text-destructive">无法加载剧情进度</p>
          <p className="text-sm text-muted-foreground">{t.loadError}</p>
          <Button type="button" onClick={() => t.reload()}>
            重试
          </Button>
        </div>
      </div>
    );
  }

  const bgDescriptor = t.currentNode
    ? getBackgroundDescriptor(config, t.currentNode.background_key)
    : getBackgroundDescriptor(config, 'night');

  const handleBuildReport = async () => {
    if (!t.progressData || t.progressData.mode !== 'AVG') return;
    try {
      setBuildingReport(true);
      setReportError(null);
      const signals = buildAvgSignals(t.progressData, config);
      const result = await fetchMbtiReport({ mode: 'AVG', signals });
      saveReportSnapshot({
        mode: 'AVG',
        result,
        generated_at: new Date().toISOString(),
      });
      router.push('/report?mode=AVG');
    } catch (error) {
      if (error instanceof ReportScoringError) {
        setReportError('生成报告失败，请稍后重试。');
      } else {
        setReportError('生成报告失败，请检查网络后重试。');
      }
    } finally {
      setBuildingReport(false);
    }
  };

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
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          星港夜话
        </h1>
        <p className="text-sm text-muted-foreground">
          每个节点确认后写入服务端（含登录后续答）。当前身份：
          <span className="ml-1 font-medium text-foreground">
            {t.authMode === 'user' ? '已登录（Bearer）' : '游客（session_id）'}
          </span>
        </p>
      </div>

      <AvgStoryProgressBar stepIndex={t.stepIndex} totalSteps={t.totalSteps} />

      {t.conflictNotice && (
        <p className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
          检测到其他端已更新进度，已为你同步为服务器最新版本。
        </p>
      )}

      {t.saveError && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
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

      <AvgStoryStage background={bgDescriptor}>
        {!t.currentNode && (
          <p className="text-sm text-destructive">当前节点配置缺失，请刷新页面。</p>
        )}

        {t.currentNode && t.isComplete && (
          <div className="rounded-2xl p-6">
            <AvgDialogueBubbles lines={t.currentNode.lines} />
            <p className="mt-6 text-center text-sm font-medium text-foreground">本段剧情已完成</p>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              你可以查看结果报告，或重新开始一轮测试。
            </p>
            {reportError && (
              <p className="mt-2 text-center text-sm text-destructive">{reportError}</p>
            )}
            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                disabled={buildingReport || t.saving}
                onClick={() => void handleBuildReport()}
              >
                {buildingReport ? '正在生成报告…' : '查看结果报告'}
              </Button>
              <span className="w-3" />
              <Button
                type="button"
                disabled={buildingReport || t.saving}
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
          <div className="p-6">
            <AvgDialogueBubbles lines={t.currentNode.lines} />
            <div className="mt-6 flex justify-end">
              <Button type="button" disabled={t.saving} onClick={() => void t.continueDialogue()}>
                继续
              </Button>
            </div>
          </div>
        )}

        {t.currentNode && !t.isComplete && t.currentNode.kind === 'choice' && (
          <div className="p-6">
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

/** 拉取 CMS 配置后挂载 AVG 引擎 */
export function AvgTestClient() {
  const [config, setConfig] = useState<AvgScriptConfig | null>(null);
  const [spriteGetters, setSpriteGetters] = useState<SpriteLineGetters | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadContent = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [script, prompts] = await Promise.all([
        fetchPublishedAvgScript(DEMO_AVG_SCRIPT_ID),
        fetchPublishedSpritePrompts().catch(() => null),
      ]);
      setConfig(script);
      setSpriteGetters(
        prompts ? createSpriteLineGetters(prompts) : { getHesitationLine, getMutexLine },
      );
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'content_load_failed');
      setConfig(null);
      setSpriteGetters(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContent();
  }, [loadContent]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div>
          <Link className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))} href="/">
            返回首页
          </Link>
        </div>
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          加载剧情配置…
        </div>
      </div>
    );
  }

  if (loadError || !config || !spriteGetters) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div>
          <Link className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))} href="/">
            返回首页
          </Link>
        </div>
        <div className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="font-medium text-destructive">无法加载剧情配置</p>
          <p className="text-sm text-muted-foreground">{loadError ?? 'unknown_error'}</p>
          <Button type="button" onClick={() => void loadContent()}>
            重试
          </Button>
        </div>
      </div>
    );
  }

  return <AvgTestRunner config={config} spriteGetters={spriteGetters} />;
}
