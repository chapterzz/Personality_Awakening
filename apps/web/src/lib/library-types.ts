/**
 * 科普图书馆前端类型：与 Nest `/library` API 响应字段一致（snake_case）。
 */

export type LibraryCategory = 'theory' | 'anti_label' | 'celebrity';

export type LibraryArticleSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: LibraryCategory;
  tags: string[];
  published_at: string;
};

export type LibraryArticleDetail = LibraryArticleSummary & {
  body_md: string;
};

export type LibraryArticleListData = {
  articles: LibraryArticleSummary[];
  available_tags: string[];
};
