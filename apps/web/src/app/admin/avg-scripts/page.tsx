/**
 * Admin AVG 脚本列表页（T4.7）。
 */
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { fetchAdminAvgScripts, type AdminAvgScriptSummary } from '@/lib/admin-api';
import { cn } from '@/lib/utils';

export default function AdminAvgScriptsPage() {
  const [items, setItems] = useState<AdminAvgScriptSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchAdminAvgScripts();
        if (!cancelled) setItems(data);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'load_failed');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-muted-foreground">加载 AVG 脚本列表…</p>;
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
      <p className="text-sm text-muted-foreground">
        学生端默认使用 <code className="rounded bg-muted px-1">demo-avg-v1</code>；原地编辑同一 ID
        发布后对学生生效。修改节点 id 可能导致进行中会话 script_mismatch。
      </p>
      <div className="overflow-x-auto rounded-2xl border-2 border-[var(--border)] bg-card shadow-clay-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-muted/40">
            <tr>
              <th className="px-4 py-3 font-semibold">ID</th>
              <th className="px-4 py-3 font-semibold">标题</th>
              <th className="px-4 py-3 font-semibold">节点数</th>
              <th className="px-4 py-3 font-semibold">状态</th>
              <th className="px-4 py-3 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{s.id}</td>
                <td className="px-4 py-3">{s.title}</td>
                <td className="px-4 py-3">{Object.keys(s.nodesJson?.nodes ?? {}).length}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                      s.isPublished
                        ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                        : 'bg-amber-500/15 text-amber-900 dark:text-amber-100',
                    )}
                  >
                    {s.isPublished ? '已发布' : '草稿'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    href={`/admin/avg-scripts/${encodeURIComponent(s.id)}`}
                  >
                    编辑
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
