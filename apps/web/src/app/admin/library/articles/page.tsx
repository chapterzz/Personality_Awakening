/**
 * Admin 科普文章列表页（T4.8）。
 */
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { getCategoryLabel } from '@/lib/library-labels';
import {
  deleteAdminLibraryArticle,
  fetchAdminLibraryArticles,
  publishAdminLibraryArticle,
  unpublishAdminLibraryArticle,
  type AdminLibraryArticleSummary,
} from '@/lib/admin-library-api';
import { LIBRARY_CATEGORY_TABS } from '@/lib/library-labels';
import { cn } from '@/lib/utils';

const CATEGORY_FILTER_OPTIONS = LIBRARY_CATEGORY_TABS;

export default function AdminLibraryArticlesPage() {
  const [items, setItems] = useState<AdminLibraryArticleSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [publishedFilter, setPublishedFilter] = useState<string>('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filter: { category?: string; isPublished?: boolean } = {};
      if (categoryFilter) filter.category = categoryFilter;
      if (publishedFilter === 'true') filter.isPublished = true;
      if (publishedFilter === 'false') filter.isPublished = false;
      const data = await fetchAdminLibraryArticles(filter);
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'load_failed');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, publishedFilter]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handlePublishToggle(article: AdminLibraryArticleSummary) {
    const msg = article.isPublished
      ? '确认下架？学生端将无法看到此文章。'
      : '确认发布？学生端 /library 将展示此文章。';
    if (!window.confirm(msg)) return;

    setActionPending(article.id);
    setError(null);
    try {
      if (article.isPublished) {
        await unpublishAdminLibraryArticle(article.id);
      } else {
        await publishAdminLibraryArticle(article.id);
      }
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'action_failed');
    } finally {
      setActionPending(null);
    }
  }

  async function handleDelete(article: AdminLibraryArticleSummary) {
    if (article.isPublished) {
      window.alert('请先下架再删除已发布文章。');
      return;
    }
    if (!window.confirm(`确认删除「${article.title}」？此操作不可恢复。`)) return;

    setActionPending(article.id);
    setError(null);
    try {
      await deleteAdminLibraryArticle(article.id);
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'delete_failed');
    } finally {
      setActionPending(null);
    }
  }

  if (loading && items.length === 0) {
    return <p className="text-muted-foreground">加载科普文章列表…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          管理科普图书馆 Markdown 文章；发布后学生端{' '}
          <code className="rounded bg-muted px-1">/library</code> 自动展示。
        </p>
        <Link
          className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}
          href="/admin/library/articles/new"
        >
          新建文章
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">分类</span>
          <select
            className="rounded-lg border border-[var(--border)] bg-background px-2 py-1"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {CATEGORY_FILTER_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value ?? ''}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">状态</span>
          <select
            className="rounded-lg border border-[var(--border)] bg-background px-2 py-1"
            value={publishedFilter}
            onChange={(e) => setPublishedFilter(e.target.value)}
          >
            <option value="">全部</option>
            <option value="true">已发布</option>
            <option value="false">草稿</option>
          </select>
        </label>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border-2 border-[var(--border)] bg-card shadow-clay-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-muted/40">
            <tr>
              <th className="px-4 py-3 font-semibold">标题</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold">分类</th>
              <th className="px-4 py-3 font-semibold">标签</th>
              <th className="px-4 py-3 font-semibold">状态</th>
              <th className="px-4 py-3 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((article) => (
              <tr key={article.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3">{article.title}</td>
                <td className="px-4 py-3 font-mono text-xs">{article.slug}</td>
                <td className="px-4 py-3">{getCategoryLabel(article.category)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {article.tags.length ? article.tags.join('、') : '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                      article.isPublished
                        ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                        : 'bg-amber-500/15 text-amber-900 dark:text-amber-100',
                    )}
                  >
                    {article.isPublished ? '已发布' : '草稿'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                      href={`/admin/library/articles/${encodeURIComponent(article.id)}`}
                    >
                      编辑
                    </Link>
                    <button
                      type="button"
                      disabled={actionPending === article.id}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                      onClick={() => void handlePublishToggle(article)}
                    >
                      {article.isPublished ? '下架' : '发布'}
                    </button>
                    <button
                      type="button"
                      disabled={actionPending === article.id || article.isPublished}
                      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                      onClick={() => void handleDelete(article)}
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">暂无文章</p>
        ) : null}
      </div>
    </div>
  );
}
