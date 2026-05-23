/**
 * Admin 问卷列表页（T4.6）：含导入导出工具栏。
 */
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { CmsImportDialog } from '@/components/admin/cms-import-dialog';
import { CmsExportDropdown, CmsRowExportLinks } from '@/components/admin/cms-export-buttons';
import { buttonVariants } from '@/components/ui/button';
import { fetchAdminQuestionnaires, type AdminQuestionnaireSummary } from '@/lib/admin-api';
import { downloadAdminExport, exportDateStamp } from '@/lib/admin-import-export-api';
import { cn } from '@/lib/utils';

export default function AdminQuestionnairesPage() {
  const [items, setItems] = useState<AdminQuestionnaireSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportError, setExportError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminQuestionnaires();
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'load_failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleExportAll(format: 'json' | 'csv') {
    setExportError(null);
    try {
      const date = exportDateStamp();
      await downloadAdminExport(
        `/admin/questionnaires/export-all?format=${format}`,
        `questionnaires-all-${date}.${format}`,
      );
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : 'export_failed');
    }
  }

  async function handleExportOne(id: string, format: 'json' | 'csv') {
    setExportError(null);
    try {
      await downloadAdminExport(
        `/admin/questionnaires/${encodeURIComponent(id)}/export?format=${format}`,
        `questionnaire-${id}.${format}`,
      );
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : 'export_failed');
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">加载问卷列表…</p>;
  }

  if (error) {
    return (
      <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm">
        加载失败：{error}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <CmsImportDialog kind="questionnaire" onSuccess={() => void reload()} />
        <CmsExportDropdown label="导出全部" formats={['json', 'csv']} onExport={handleExportAll} />
      </div>

      {exportError ? (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm">
          导出失败：{exportError}
        </p>
      ) : null}

      <p className="text-sm text-muted-foreground">
        学生端默认使用 <code className="rounded bg-muted px-1">adaptive-demo-v1</code>；原地编辑同一
        ID 发布后对学生生效。
      </p>
      <div className="overflow-x-auto rounded-2xl border-2 border-[var(--border)] bg-card shadow-clay-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-muted/40">
            <tr>
              <th className="px-4 py-3 font-semibold">ID</th>
              <th className="px-4 py-3 font-semibold">标题</th>
              <th className="px-4 py-3 font-semibold">题目数</th>
              <th className="px-4 py-3 font-semibold">状态</th>
              <th className="px-4 py-3 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((q) => (
              <tr key={q.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{q.id}</td>
                <td className="px-4 py-3">{q.title}</td>
                <td className="px-4 py-3">{q._count.questions}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                      q.isPublished
                        ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                        : 'bg-amber-500/15 text-amber-900 dark:text-amber-100',
                    )}
                  >
                    {q.isPublished ? '已发布' : '草稿'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                      href={`/admin/questionnaires/${encodeURIComponent(q.id)}`}
                    >
                      编辑
                    </Link>
                    <CmsRowExportLinks
                      formats={['json', 'csv']}
                      onExport={(format) => void handleExportOne(q.id, format)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
