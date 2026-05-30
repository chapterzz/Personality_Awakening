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

function parseAvgScriptEnvelope(
  body: ApiEnvelope<AvgScriptConfig>,
  res: Response,
): AvgScriptConfig {
  if (!res.ok || !body.success) {
    const code = body.message ?? 'avg_script_fetch_failed';
    if (code === 'avg_script_not_found' || code === 'avg_script_none_published') {
      throw new Error('暂无已发布的 AVG 剧情，请在管理后台导入并发布脚本后再试。');
    }
    throw new Error(code);
  }
  return body.data;
}

/**
 * 拉取指定 ID 的已发布 AVG 脚本。
 */
export async function fetchPublishedAvgScript(id: string): Promise<AvgScriptConfig> {
  const res = await fetch(`${apiBase()}/avg-script/${encodeURIComponent(id)}`);
  const body = (await res.json()) as ApiEnvelope<AvgScriptConfig>;
  return parseAvgScriptEnvelope(body, res);
}

/**
 * 拉取当前生效的已发布 AVG 脚本（最近发布的一条，与学生端进度 script_id 对齐）。
 */
export async function fetchActivePublishedAvgScript(): Promise<AvgScriptConfig> {
  const res = await fetch(`${apiBase()}/avg-script/active`);
  const body = (await res.json()) as ApiEnvelope<AvgScriptConfig>;
  return parseAvgScriptEnvelope(body, res);
}
