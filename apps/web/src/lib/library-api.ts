/**
 * 科普图书馆 API 客户端：调用后端 /library 公开端点。
 */
import { getBrowserApiBaseUrl } from '@/lib/api-base';
import type { LibraryArticleDetail, LibraryArticleListData } from '@/lib/library-types';

export type FetchLibraryArticlesParams = {
  category?: string;
  tag?: string;
};

/**
 * 获取已发布文章列表（可选 category / tag 筛选）。
 */
export async function fetchLibraryArticles(
  params: FetchLibraryArticlesParams = {},
): Promise<LibraryArticleListData> {
  const base = getBrowserApiBaseUrl().replace(/\/$/, '');
  const search = new URLSearchParams();
  if (params.category) search.set('category', params.category);
  if (params.tag) search.set('tag', params.tag);
  const qs = search.toString();
  const url = `${base}/library/articles${qs ? `?${qs}` : ''}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`library_articles_http_${res.status}`);
  }
  const body = await res.json();
  if (!body.success) {
    throw new Error(body.message ?? 'library_articles_error');
  }
  return body.data as LibraryArticleListData;
}

/**
 * 按 slug 获取文章详情；404 时抛出带 status 信息的错误。
 */
export async function fetchLibraryArticleBySlug(slug: string): Promise<LibraryArticleDetail> {
  const base = getBrowserApiBaseUrl().replace(/\/$/, '');
  const res = await fetch(`${base}/library/articles/${encodeURIComponent(slug)}`);
  if (!res.ok) {
    throw new Error(`library_article_http_${res.status}`);
  }
  const body = await res.json();
  if (!body.success) {
    throw new Error(body.message ?? 'library_article_error');
  }
  return body.data as LibraryArticleDetail;
}

/**
 * 根据当前筛选构造列表页 URL query（供 Tab / Chips 同步）。
 */
export function buildLibraryListQuery(params: {
  category?: string | null;
  tag?: string | null;
}): string {
  const search = new URLSearchParams();
  if (params.category) search.set('category', params.category);
  if (params.tag) search.set('tag', params.tag);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}
