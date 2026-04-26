/**
 * 结果页快照本地存储：缓存最近一次 MBTI 结果，供 `/report` 刷新回显。
 */
import type { MbtiMode, MbtiReportResult } from '@/lib/report-scoring';

const REPORT_SNAPSHOT_KEY = 'ppa_report_snapshot_v1';

export type ReportSnapshot = {
  mode: MbtiMode;
  result: MbtiReportResult;
  generated_at: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function saveReportSnapshot(snapshot: ReportSnapshot): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REPORT_SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export function loadReportSnapshot(): ReportSnapshot | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(REPORT_SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return null;
    if (
      (parsed.mode !== 'STANDARD' && parsed.mode !== 'AVG') ||
      typeof parsed.generated_at !== 'string'
    ) {
      return null;
    }
    if (!isRecord(parsed.result) || typeof parsed.result.mbti_type !== 'string') {
      return null;
    }
    return parsed as ReportSnapshot;
  } catch {
    return null;
  }
}

export function clearReportSnapshot(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(REPORT_SNAPSHOT_KEY);
}
