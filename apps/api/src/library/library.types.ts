/**
 * 科普图书馆 API 类型：分类枚举与列表/详情响应契约（snake_case 字段名与前端 library-types 对齐）。
 */

/** PRD 三分类 */
export const LIBRARY_CATEGORIES = ['theory', 'anti_label', 'celebrity'] as const;

export type LibraryCategory = (typeof LIBRARY_CATEGORIES)[number];

/** 列表项（不含正文） */
export type LibraryArticleSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: LibraryCategory;
  tags: string[];
  published_at: string;
};

/** 详情（含 Markdown 正文） */
export type LibraryArticleDetail = LibraryArticleSummary & {
  body_md: string;
};

/** 列表 data 载荷 */
export type LibraryArticleListData = {
  articles: LibraryArticleSummary[];
  available_tags: string[];
};
