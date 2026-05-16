/**
 * 全局洞察看板 API 客户端：调用后端 /dashboard 端点获取聚合统计数据。
 */
import { getAccessToken } from '@/lib/auth-token';
import { getBrowserApiBaseUrl } from '@/lib/api-base';

/** 类型分布项 */
export type TypeDistributionItem = {
  type: string;
  count: number;
};

/** 精灵热力图项 */
export type SpriteHeatmapItem = {
  type: string;
  sprite: string;
  count: number;
};

/** 趣味数据 */
export type FunInsights = {
  mostCommonType: { type: string; count: number; percentage: number };
  rarestType: { type: string; count: number; percentage: number };
  mostPopularSprite: { sprite: string; count: number };
  dimensionBalance: Record<string, number>;
};

/** 看板统计数据 */
export type DashboardStats = {
  totalUsers: number;
  typeDistribution: TypeDistributionItem[];
  spriteHeatmap: SpriteHeatmapItem[];
  funInsights: FunInsights;
};

/** 个人对比数据 */
export type MyComparison = {
  myType: string;
  typePercentage: number;
  typeRank: number;
};

/** 获取全局看板统计数据（公开） */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const base = getBrowserApiBaseUrl();
  const res = await fetch(`${base.replace(/\/$/, '')}/dashboard/stats`);
  if (!res.ok) {
    throw new Error(`dashboard_stats_http_${res.status}`);
  }
  const body = await res.json();
  if (!body.success) {
    throw new Error(body.message ?? 'dashboard_stats_error');
  }
  return body.data;
}

/** 获取当前用户与全局数据的对比（需 JWT） */
export async function fetchMyComparison(): Promise<MyComparison | null> {
  const token = getAccessToken();
  if (!token) return null;

  const base = getBrowserApiBaseUrl();
  const res = await fetch(`${base.replace(/\/$/, '')}/dashboard/my-comparison`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 401) return null;
    throw new Error(`my_comparison_http_${res.status}`);
  }
  const body = await res.json();
  if (!body.success) return null;
  return body.data;
}
