/**
 * Admin 问卷详情：题目表格、选项编辑、发布/下架（T4.6）。
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { QuestionEditorTable } from '@/components/admin/question-editor-table';
import {
  fetchAdminQuestionnaire,
  publishQuestionnaire,
  unpublishQuestionnaire,
  type AdminQuestionnaireDetail,
} from '@/lib/admin-api';
import { cn } from '@/lib/utils';

export default function AdminQuestionnaireDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const [detail, setDetail] = useState<AdminQuestionnaireDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminQuestionnaire(id);
      setDetail(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'load_failed');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handlePublishToggle() {
    if (!detail) return;
    const msg = detail.isPublished
      ? '确认下架？学生端将无法拉取此问卷。'
      : '确认发布？将覆盖学生端可见内容；进行中的测评可能看到更新后的题干。';
    if (!window.confirm(msg)) return;

    setActionPending(true);
    setError(null);
    try {
      if (detail.isPublished) {
        await unpublishQuestionnaire(detail.id);
      } else {
        await publishQuestionnaire(detail.id);
      }
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'action_failed');
    } finally {
      setActionPending(false);
    }
  }

  if (loading && !detail) {
    return <p className="text-muted-foreground">加载问卷详情…</p>;
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
          <p className="font-mono text-xs text-muted-foreground">{detail.id}</p>
          <h2 className="font-display text-2xl font-bold">{detail.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            状态：{detail.isPublished ? '已发布' : '草稿'}
            {detail.publishedAt
              ? ` · 最近发布 ${new Date(detail.publishedAt).toLocaleString('zh-CN')}`
              : ''}
          </p>
        </div>
        <button
          type="button"
          disabled={actionPending}
          className={cn(
            buttonVariants({ variant: detail.isPublished ? 'outline' : 'default' }),
            'shrink-0',
          )}
          onClick={() => void handlePublishToggle()}
        >
          {actionPending ? '处理中…' : detail.isPublished ? '下架问卷' : '发布问卷'}
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      {!detail.isPublished ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
          当前为草稿。发布前请确认每题至少 2 个选项、四维度各至少 12 题，且计分选项
          dimension/side/weight 完整。
        </p>
      ) : null}

      <QuestionEditorTable
        questionnaireId={detail.id}
        questions={detail.questions}
        onSaved={reload}
      />
    </div>
  );
}
