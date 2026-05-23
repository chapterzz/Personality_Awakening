/**
 * 科普图书馆文章字段校验：slug、分类、标签与发布前聚合规则（T4.8）。
 */
import { LIBRARY_CATEGORIES, type LibraryCategory } from './library.types';

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ValidationResult = { ok: true } | { ok: false; message: string };

/**
 * 校验 slug 格式与长度（2–80，小写 kebab-case）。
 */
export function validateSlug(slug: string): ValidationResult {
  const trimmed = slug.trim();
  if (trimmed.length < 2 || trimmed.length > 80) {
    return { ok: false, message: 'slug_length_invalid' };
  }
  if (!SLUG_REGEX.test(trimmed)) {
    return { ok: false, message: 'slug_format_invalid' };
  }
  return { ok: true };
}

/**
 * 规范化标签：trim、去重、丢弃空项，最多 10 个、每项 1–32 字符。
 */
export function normalizeTags(raw: string[]): string[] {
  const set = new Set<string>();
  for (const t of raw) {
    const v = t.trim();
    if (v.length >= 1 && v.length <= 32) set.add(v);
  }
  return [...set].slice(0, 10);
}

/**
 * 判断 category 是否为 PRD 三分类之一。
 */
export function validateCategory(category: string): category is LibraryCategory {
  return (LIBRARY_CATEGORIES as readonly string[]).includes(category);
}

export type ArticleForPublish = {
  title: string;
  slug: string;
  bodyMd: string;
  category: string;
};

/**
 * 发布前聚合校验：title、slug、category、bodyMd 必填规则。
 */
export function validateArticleForPublish(article: ArticleForPublish): ValidationResult {
  if (!article.title.trim() || article.title.trim().length > 120) {
    return { ok: false, message: 'title_invalid' };
  }
  const slugResult = validateSlug(article.slug);
  if (!slugResult.ok) return slugResult;
  if (!validateCategory(article.category)) {
    return { ok: false, message: 'category_invalid' };
  }
  if (article.bodyMd.trim().length < 10) {
    return { ok: false, message: 'body_too_short' };
  }
  return { ok: true };
}
