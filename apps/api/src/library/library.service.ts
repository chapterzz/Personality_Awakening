/**
 * 科普图书馆服务：已发布文章列表/详情查询、筛选条件构造与可用标签聚合。
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  LibraryArticleDetail,
  LibraryArticleListData,
  LibraryArticleSummary,
  LibraryCategory,
} from './library.types';
import { LIBRARY_CATEGORIES } from './library.types';

const LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  category: true,
  tags: true,
  publishedAt: true,
} satisfies Prisma.LibraryArticleSelect;

type ListRow = Prisma.LibraryArticleGetPayload<{ select: typeof LIST_SELECT }>;

export type ListArticlesFilter = {
  category?: string;
  tag?: string;
};

@Injectable()
export class LibraryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 构造列表 Prisma where：仅已发布且 publishedAt 非空；category/tag 为 AND。
   */
  buildListWhere(filter: ListArticlesFilter = {}): Prisma.LibraryArticleWhereInput {
    const where: Prisma.LibraryArticleWhereInput = {
      isPublished: true,
      publishedAt: { not: null },
    };
    if (filter.category) {
      where.category = filter.category;
    }
    if (filter.tag) {
      where.tags = { has: filter.tag };
    }
    return where;
  }

  /**
   * 从文章行聚合去重、排序后的标签列表（供 Chips 展示）。
   */
  collectAvailableTags(rows: Array<{ tags: string[] }>): string[] {
    const set = new Set<string>();
    for (const row of rows) {
      for (const tag of row.tags) {
        set.add(tag);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }

  /** 已发布文章列表（不含 body_md）及当前筛选下的 available_tags */
  async findPublishedList(filter: ListArticlesFilter): Promise<LibraryArticleListData> {
    const where = this.buildListWhere(filter);
    const rows = await this.prisma.libraryArticle.findMany({
      where,
      select: LIST_SELECT,
      orderBy: [{ publishedAt: 'desc' }, { title: 'asc' }],
    });

    const baseWhere = this.buildListWhere(filter.category ? { category: filter.category } : {});
    const tagSourceRows = await this.prisma.libraryArticle.findMany({
      where: baseWhere,
      select: { tags: true },
    });

    return {
      articles: rows.map((row) => this.mapSummary(row)),
      available_tags: this.collectAvailableTags(tagSourceRows),
    };
  }

  /** 按 slug 获取已发布详情；未发布或不存在 → 404 */
  async findPublishedBySlug(slug: string): Promise<LibraryArticleDetail> {
    const row = await this.prisma.libraryArticle.findUnique({ where: { slug } });
    if (!row || !row.isPublished || !row.publishedAt) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'article_not_found',
      });
    }
    return {
      ...this.mapSummary(row),
      body_md: row.bodyMd,
    };
  }

  private mapSummary(row: ListRow | (ListRow & { bodyMd?: string })): LibraryArticleSummary {
    const category = row.category as LibraryCategory;
    if (!LIBRARY_CATEGORIES.includes(category)) {
      throw new Error(`invalid_library_category:${row.category}`);
    }
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      category,
      tags: row.tags,
      published_at: row.publishedAt!.toISOString(),
    };
  }
}
