/**
 * Admin 精灵文案编辑页：犹豫提示 + 四维互斥文案、保存与发布（T4.7）。
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import {
  fetchAdminSpritePrompts,
  publishSpritePrompts,
  unpublishSpritePrompts,
  updateAdminSpritePrompts,
  type AdminSpritePromptDetail,
} from '@/lib/admin-api';
import { cn } from '@/lib/utils';

const MUTEX_DIMS = ['EI', 'SN', 'TF', 'JP'] as const;

export default function AdminSpritePromptsPage() {
  const [detail, setDetail] = useState<AdminSpritePromptDetail | null>(null);
  const [hesitationText, setHesitationText] = useState('');
  const [mutexTexts, setMutexTexts] = useState<Record<string, string>>({
    EI: '',
    SN: '',
    TF: '',
    JP: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminSpritePrompts();
      setDetail(data);
      setHesitationText(data.hesitationLines.join('\n'));
      setMutexTexts({
        EI: (data.mutexLines.EI ?? []).join('\n'),
        SN: (data.mutexLines.SN ?? []).join('\n'),
        TF: (data.mutexLines.TF ?? []).join('\n'),
        JP: (data.mutexLines.JP ?? []).join('\n'),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'load_failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  function buildPayload() {
    const hesitationLines = hesitationText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const mutexLines: Record<string, string[]> = {};
    for (const dim of MUTEX_DIMS) {
      mutexLines[dim] = (mutexTexts[dim] ?? '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
    }
    return { hesitationLines, mutexLines };
  }

  async function handleSave() {
    setActionPending(true);
    setError(null);
    try {
      await updateAdminSpritePrompts(buildPayload());
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'save_failed');
    } finally {
      setActionPending(false);
    }
  }

  async function handlePublishToggle() {
    if (!detail) return;
    const msg = detail.isPublished
      ? '确认下架？学生端将无法拉取精灵文案。'
      : '确认发布？标准模式与 AVG 模式的精灵提示将更新。';
    if (!window.confirm(msg)) return;

    setActionPending(true);
    setError(null);
    try {
      if (detail.isPublished) {
        await unpublishSpritePrompts();
      } else {
        await publishSpritePrompts();
      }
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'action_failed');
    } finally {
      setActionPending(false);
    }
  }

  if (loading && !detail) {
    return <p className="text-muted-foreground">加载精灵文案…</p>;
  }

  if (error && !detail) {
    return (
      <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm">
        加载失败：{error}
      </p>
    );
  }

  if (!detail) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">精灵互动文案</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            状态：{detail.isPublished ? '已发布' : '草稿'}
            {detail.publishedAt
              ? ` · 最近发布 ${new Date(detail.publishedAt).toLocaleString('zh-CN')}`
              : ''}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            标准模式与 AVG 模式共用；每行一条文案，保存后需单独发布。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={actionPending}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            onClick={() => void handleSave()}
          >
            保存
          </button>
          <button
            type="button"
            disabled={actionPending}
            className={cn(
              buttonVariants({ variant: detail.isPublished ? 'outline' : 'default', size: 'sm' }),
            )}
            onClick={() => void handlePublishToggle()}
          >
            {detail.isPublished ? '下架' : '发布'}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        <label className="font-semibold" htmlFor="hesitation-lines">
          犹豫提示（每行一条）
        </label>
        <textarea
          id="hesitation-lines"
          className="min-h-[120px] w-full rounded-xl border-2 border-[var(--border)] bg-card p-3 text-sm"
          value={hesitationText}
          onChange={(e) => setHesitationText(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {MUTEX_DIMS.map((dim) => (
          <div key={dim} className="space-y-2">
            <label className="font-semibold" htmlFor={`mutex-${dim}`}>
              {dim} 互斥吐槽（每行一条）
            </label>
            <textarea
              id={`mutex-${dim}`}
              className="min-h-[100px] w-full rounded-xl border-2 border-[var(--border)] bg-card p-3 text-sm"
              value={mutexTexts[dim]}
              onChange={(e) => setMutexTexts((prev) => ({ ...prev, [dim]: e.target.value }))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
