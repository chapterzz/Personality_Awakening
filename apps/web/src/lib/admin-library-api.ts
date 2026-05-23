/**
 * Admin 科普图书馆 CMS API 客户端（T4.8）。
 */
import { getBrowserApiBaseUrl } from '@/lib/api-base';
import { getAdminToken } from '@/lib/admin-auth';

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message: string | null;
};

function apiBase(): string {
  return getBrowserApiBaseUrl().replace(/\/$/, '');
}

function authHeaders(): HeadersInit {
  const token = getAdminToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiEnvelope<T> & { message?: string };
  if (!res.ok || !body.success) {
    throw new Error(body.message ?? `admin_library_api_${res.status}`);
  }
  return body.data;
}

export type AdminLibraryArticleSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  bodyMd: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  publishedAt: string | null;
};

export type AdminLibraryArticleDetail = AdminLibraryArticleSummary;

export type CreateAdminLibraryArticlePayload = {
  title: string;
  slug: string;
  bodyMd: string;
  excerpt?: string | null;
  category?: string;
  tags?: string[];
};

export type UpdateAdminLibraryArticlePayload = Partial<CreateAdminLibraryArticlePayload>;

export type AdminLibraryListFilter = {
  category?: string;
  isPublished?: boolean;
};

/** 文章列表（含未发布） */
export async function fetchAdminLibraryArticles(
  filter: AdminLibraryListFilter = {},
): Promise<AdminLibraryArticleSummary[]> {
  const params = new URLSearchParams();
  if (filter.category) params.set('category', filter.category);
  if (filter.isPublished !== undefined) {
    params.set('isPublished', String(filter.isPublished));
  }
  const qs = params.toString();
  const url = `${apiBase()}/admin/library/articles${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { headers: authHeaders() });
  return parseEnvelope(res);
}

/** 创建文章草稿 */
export async function createAdminLibraryArticle(
  payload: CreateAdminLibraryArticlePayload,
): Promise<AdminLibraryArticleDetail> {
  const res = await fetch(`${apiBase()}/admin/library/articles`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parseEnvelope(res);
}

/** 文章详情 */
export async function fetchAdminLibraryArticle(id: string): Promise<AdminLibraryArticleDetail> {
  const res = await fetch(`${apiBase()}/admin/library/articles/${encodeURIComponent(id)}`, {
    headers: authHeaders(),
  });
  return parseEnvelope(res);
}

/** 更新文章 */
export async function updateAdminLibraryArticle(
  id: string,
  payload: UpdateAdminLibraryArticlePayload,
): Promise<AdminLibraryArticleDetail> {
  const res = await fetch(`${apiBase()}/admin/library/articles/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parseEnvelope(res);
}

/** 删除文章（已发布须先下架） */
export async function deleteAdminLibraryArticle(id: string): Promise<void> {
  const res = await fetch(`${apiBase()}/admin/library/articles/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await parseEnvelope(res);
}

/** 发布文章 */
export async function publishAdminLibraryArticle(id: string): Promise<AdminLibraryArticleDetail> {
  const res = await fetch(`${apiBase()}/admin/library/articles/${encodeURIComponent(id)}/publish`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return parseEnvelope(res);
}

/** 下架文章 */
export async function unpublishAdminLibraryArticle(id: string): Promise<AdminLibraryArticleDetail> {
  const res = await fetch(
    `${apiBase()}/admin/library/articles/${encodeURIComponent(id)}/unpublish`,
    {
      method: 'POST',
      headers: authHeaders(),
    },
  );
  return parseEnvelope(res);
}
