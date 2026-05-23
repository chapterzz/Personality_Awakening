/**
 * 学生端 AVG 脚本公开 API 客户端（T4.7）。
 */
import { getBrowserApiBaseUrl } from '@/lib/api-base';
import type { AvgScriptConfig } from '@/data/avg-demo-script';

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message: string | null;
};

function apiBase(): string {
  return getBrowserApiBaseUrl().replace(/\/$/, '');
}

/**
 * 拉取已发布 AVG 脚本，组装为 AvgScriptConfig。
 */
export async function fetchPublishedAvgScript(id: string): Promise<AvgScriptConfig> {
  const res = await fetch(`${apiBase()}/avg-script/${encodeURIComponent(id)}`);
  const body = (await res.json()) as ApiEnvelope<AvgScriptConfig>;
  if (!res.ok || !body.success) {
    throw new Error(body.message ?? 'avg_script_fetch_failed');
  }
  return body.data;
}
