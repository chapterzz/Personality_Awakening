/**
 * Admin AVG 脚本详情：JSON 编辑、校验保存、节点预览、发布/下架（T4.7）。
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import {
  fetchAdminAvgScript,
  publishAvgScript,
  unpublishAvgScript,
  updateAvgScriptNodes,
  type AdminAvgScriptDetail,
} from '@/lib/admin-api';
import { cn } from '@/lib/utils';

type NodesJson = AdminAvgScriptDetail['nodesJson'];

export default function AdminAvgScriptDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const [detail, setDetail] = useState<AdminAvgScriptDetail | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminAvgScript(id);
      setDetail(data);
      setJsonText(JSON.stringify(data.nodesJson, null, 2));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'load_failed');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const previewNodes = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonText) as NodesJson;
      return Object.entries(parsed.nodes ?? {}).map(([nodeId, node]) => {
        const n = node as Record<string, unknown>;
        return {
          id: nodeId,
          kind: String(n.kind ?? '?'),
          background: String(n.background_key ?? ''),
          next:
            n.kind === 'dialogue'
              ? String(n.next_id ?? '')
              : n.kind === 'choice'
                ? `${Array.isArray(n.options) ? n.options.length : 0} 选项`
                : '—',
        };
      });
    } catch {
      return null;
    }
  }, [jsonText]);

  async function handleSave() {
    if (!detail) return;
    setActionPending(true);
    setError(null);
    try {
      const nodesJson = JSON.parse(jsonText) as NodesJson;
      await updateAvgScriptNodes(detail.id, nodesJson);
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
      ? '确认下架？学生端将无法拉取此脚本。'
      : '确认发布？修改节点 id 可能导致进行中 AVG 会话 script_mismatch。';
    if (!window.confirm(msg)) return;

    setActionPending(true);
    setError(null);
    try {
      if (detail.isPublished) {
        await unpublishAvgScript(detail.id);
      } else {
        await publishAvgScript(detail.id);
      }
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'action_failed');
    } finally {
      setActionPending(false);
    }
  }

  if (loading && !detail) {
    return <p className="text-muted-foreground">加载 AVG 脚本详情…</p>;
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
          {detail.isPublished ? '下架' : '发布'}
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">nodesJson（不含 script_id）</h3>
          <button
            type="button"
            disabled={actionPending}
            className={cn(buttonVariants({ size: 'sm' }))}
            onClick={() => void handleSave()}
          >
            校验并保存
          </button>
        </div>
        <textarea
          className="min-h-[320px] w-full rounded-xl border-2 border-[var(--border)] bg-slate-950 p-3 font-mono text-xs text-slate-100"
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          spellCheck={false}
        />
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">节点预览（只读）</h3>
        {previewNodes ? (
          <div className="overflow-x-auto rounded-2xl border-2 border-[var(--border)] bg-card">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-muted/40">
                <tr>
                  <th className="px-3 py-2">节点 ID</th>
                  <th className="px-3 py-2">类型</th>
                  <th className="px-3 py-2">背景 key</th>
                  <th className="px-3 py-2">下一步</th>
                </tr>
              </thead>
              <tbody>
                {previewNodes.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-3 py-2 font-mono text-xs">{row.id}</td>
                    <td className="px-3 py-2">{row.kind}</td>
                    <td className="px-3 py-2">{row.background}</td>
                    <td className="px-3 py-2">{row.next}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">JSON 格式无效，无法预览节点表。</p>
        )}
      </div>
    </div>
  );
}
