/**
 * Admin 科普文章编辑页：保存、发布/下架、删除（T4.8）。
 */
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  LibraryArticleForm,
  parseTagsInput,
  type LibraryArticleFormValues,
} from '@/components/admin/library-article-form';
import { buttonVariants } from '@/components/ui/button';
import {
  deleteAdminLibraryArticle,
  fetchAdminLibraryArticle,
  publishAdminLibraryArticle,
  unpublishAdminLibraryArticle,
  updateAdminLibraryArticle,
  type AdminLibraryArticleDetail,
} from '@/lib/admin-library-api';
import { cn } from '@/lib/utils';

function toFormValues(article: AdminLibraryArticleDetail): LibraryArticleFormValues {
  return {
    title: article.title,
    slug: article.slug,
    category: article.category,
    tags: article.tags.join(', '),
    excerpt: article.excerpt ?? '',
    bodyMd: article.bodyMd,
  };
}

export default function AdminEditLibraryArticlePage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const [detail, setDetail] = useState<AdminLibraryArticleDetail | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminLibraryArticle(id);
      setDetail(data);
      setFormKey((k) => k + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'load_failed');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleSave(values: LibraryArticleFormValues) {
    if (!detail) return;
    setActionPending(true);
    setError(null);
    try {
      await updateAdminLibraryArticle(detail.id, {
        title: values.title.trim(),
        slug: values.slug.trim(),
        bodyMd: values.bodyMd,
        excerpt: values.excerpt.trim() || null,
        category: values.category,
        tags: parseTagsInput(values.tags),
      });
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
      ? '确认下架？学生端将无法看到此文章。'
      : '确认发布？请确保标题、slug 与正文已填写完整。';
    if (!window.confirm(msg)) return;

    setActionPending(true);
    setError(null);
    try {
      if (detail.isPublished) {
        await unpublishAdminLibraryArticle(detail.id);
      } else {
        await publishAdminLibraryArticle(detail.id);
      }
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'action_failed');
    } finally {
      setActionPending(false);
    }
  }

  async function handleDelete() {
    if (!detail) return;
    if (detail.isPublished) {
      window.alert('请先下架再删除已发布文章。');
      return;
    }
    if (!window.confirm(`确认删除「${detail.title}」？此操作不可恢复。`)) return;

    setActionPending(true);
    setError(null);
    try {
      await deleteAdminLibraryArticle(detail.id);
      router.push('/admin/library/articles');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'delete_failed');
      setActionPending(false);
    }
  }

  if (loading && !detail) {
    return <p className="text-muted-foreground">加载文章详情…</p>;
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
        <div className="flex flex-wrap gap-2">
          <Link
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            href="/admin/library/articles"
          >
            返回列表
          </Link>
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
          <button
            type="button"
            disabled={actionPending || detail.isPublished}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            onClick={() => void handleDelete()}
          >
            删除
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      <LibraryArticleForm
        key={formKey}
        initial={toFormValues(detail)}
        submitLabel="保存修改"
        pending={actionPending}
        onSubmit={handleSave}
      />
    </div>
  );
}
