/**
 * Admin CMS 导入导出 API 客户端：问卷 JSON/CSV 与 AVG JSON 单文件导入导出。
 */
import { getBrowserApiBaseUrl } from '@/lib/api-base';
import { getAdminToken } from '@/lib/admin-auth';

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message: string | null;
};

export type ImportValidationError = {
  code: string;
  path?: string;
  row?: number;
};

export type ImportDryRunResult = {
  valid: boolean;
  conflicts: Array<{ id: string; existing_title?: string }>;
  preview: {
    count: number;
    items: Array<{
      id: string;
      title: string;
      question_count?: number;
      node_count?: number;
    }>;
  };
  validation_errors: ImportValidationError[];
};

export type ImportCommitOptions = {
  onConflict: 'overwrite' | 'create_new' | 'cancel';
  publishAfter: boolean;
  newIdSuffix?: string;
};

export type ImportCommitResult = {
  imported: Array<{ id: string; title: string }>;
};

/** 导入/导出 API 错误，含校验明细 */
export class AdminImportExportError extends Error {
  validationErrors: ImportValidationError[];

  constructor(message: string, validationErrors: ImportValidationError[] = []) {
    super(message);
    this.name = 'AdminImportExportError';
    this.validationErrors = validationErrors;
  }
}

function apiBase(): string {
  return getBrowserApiBaseUrl().replace(/\/$/, '');
}

function authHeaders(): HeadersInit {
  const token = getAdminToken();
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function appendQueryParams(
  path: string,
  params: Record<string, string | boolean | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

async function parseImportError(res: Response): Promise<never> {
  let message = `import_export_${res.status}`;
  let validationErrors: ImportValidationError[] = [];
  try {
    const body = (await res.json()) as ApiEnvelope<{ validation_errors?: ImportValidationError[] }>;
    message = body.message ?? message;
    validationErrors = body.data?.validation_errors ?? [];
  } catch {
    // 非 JSON 响应
  }
  throw new AdminImportExportError(message, validationErrors);
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiEnvelope<T> & {
    message?: string;
    data?: (T & { validation_errors?: ImportValidationError[] }) | null;
  };
  if (!res.ok || !body.success) {
    const validationErrors =
      (body.data as { validation_errors?: ImportValidationError[] } | null)?.validation_errors ??
      [];
    throw new AdminImportExportError(
      body.message ?? `admin_import_${res.status}`,
      validationErrors,
    );
  }
  return body.data as T;
}

function buildImportFormData(file: File): FormData {
  const fd = new FormData();
  fd.append('file', file);
  return fd;
}

/** 下载 Admin 导出文件并触发浏览器保存 */
export async function downloadAdminExport(path: string, filename: string): Promise<void> {
  const url = path.startsWith('http')
    ? path
    : `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    await parseImportError(res);
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

/** 问卷导入 dry_run */
export async function dryRunQuestionnaireImport(
  file: File,
  format: 'json' | 'csv',
): Promise<ImportDryRunResult> {
  const path = appendQueryParams('/admin/questionnaires/import', {
    format,
    dry_run: true,
  });
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: buildImportFormData(file),
  });
  return parseEnvelope<ImportDryRunResult>(res);
}

/** 问卷导入正式提交 */
export async function commitQuestionnaireImport(
  file: File,
  format: 'json' | 'csv',
  options: ImportCommitOptions,
): Promise<ImportCommitResult> {
  const path = appendQueryParams('/admin/questionnaires/import', {
    format,
    dry_run: false,
    on_conflict: options.onConflict,
    publish_after: options.publishAfter,
    new_id_suffix: options.newIdSuffix,
  });
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: buildImportFormData(file),
  });
  return parseEnvelope<ImportCommitResult>(res);
}

/** AVG 导入 dry_run（仅 JSON） */
export async function dryRunAvgImport(file: File): Promise<ImportDryRunResult> {
  const path = appendQueryParams('/admin/avg-scripts/import', { dry_run: true });
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: buildImportFormData(file),
  });
  return parseEnvelope<ImportDryRunResult>(res);
}

/** AVG 导入正式提交 */
export async function commitAvgImport(
  file: File,
  options: ImportCommitOptions,
): Promise<ImportCommitResult> {
  const path = appendQueryParams('/admin/avg-scripts/import', {
    dry_run: false,
    on_conflict: options.onConflict,
    publish_after: options.publishAfter,
    new_id_suffix: options.newIdSuffix,
  });
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: buildImportFormData(file),
  });
  return parseEnvelope<ImportCommitResult>(res);
}

/** 从文件名推断问卷导入格式 */
export function detectQuestionnaireFormat(file: File): 'json' | 'csv' | null {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.csv')) return 'csv';
  return null;
}

/** 导出文件名日期戳 YYYY-MM-DD */
export function exportDateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 格式化校验错误为可读中文 */
export function formatValidationErrors(errors: ImportValidationError[]): string {
  return errors
    .map((e) => {
      const loc = e.row != null ? `第 ${e.row} 行` : e.path ? e.path : '';
      return loc ? `${loc}: ${e.code}` : e.code;
    })
    .join('；');
}
