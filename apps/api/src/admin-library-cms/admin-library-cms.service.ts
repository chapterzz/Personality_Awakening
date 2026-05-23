/**
 * Admin 科普图书馆 CMS 服务（T4.8）：文章 CRUD、发布/下架与字段校验。
 */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  normalizeTags,
  validateArticleForPublish,
  validateCategory,
  validateSlug,
} from '../library/library-validation';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

export type AdminArticleDetail = {
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

export type ListArticlesFilter = {
  category?: string;
  isPublished?: boolean;
};

@Injectable()
export class AdminLibraryCmsService {
  constructor(private readonly prisma: PrismaService) {}

  private validationToBadRequest(message: string): never {
    throw new BadRequestException({
      success: false,
      data: null,
      message,
    });
  }

  /** 文章列表（含未发布），可按分类/发布状态筛选 */
  async listArticles(filter: ListArticlesFilter = {}): Promise<AdminArticleDetail[]> {
    const where: Prisma.LibraryArticleWhereInput = {};
    if (filter.category) {
      where.category = filter.category;
    }
    if (filter.isPublished !== undefined) {
      where.isPublished = filter.isPublished;
    }

    const rows = await this.prisma.libraryArticle.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { title: 'asc' }],
    });
    return rows.map((row) => this.mapArticle(row));
  }

  /** 文章详情（含 bodyMd） */
  async getArticle(id: string): Promise<AdminArticleDetail> {
    const row = await this.prisma.libraryArticle.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'article_not_found',
      });
    }
    return this.mapArticle(row);
  }

  /** 创建草稿（默认未发布） */
  async createArticle(dto: CreateArticleDto): Promise<AdminArticleDetail> {
    const slug = dto.slug.trim();
    const slugResult = validateSlug(slug);
    if (!slugResult.ok) {
      this.validationToBadRequest(slugResult.message);
    }

    const category = dto.category ?? 'theory';
    if (!validateCategory(category)) {
      this.validationToBadRequest('category_invalid');
    }

    const excerptResult = this.validateExcerpt(dto.excerpt);
    if (!excerptResult.ok) {
      this.validationToBadRequest(excerptResult.message);
    }

    await this.ensureSlugAvailable(slug);

    try {
      const row = await this.prisma.libraryArticle.create({
        data: {
          title: dto.title.trim(),
          slug,
          bodyMd: dto.bodyMd,
          excerpt: dto.excerpt?.trim() || null,
          category,
          tags: normalizeTags(dto.tags ?? []),
          isPublished: false,
        },
      });
      return this.mapArticle(row);
    } catch (e: unknown) {
      if (this.isUniqueViolation(e)) {
        throw new ConflictException({
          success: false,
          data: null,
          message: 'slug_taken',
        });
      }
      throw e;
    }
  }

  /** 更新文章元数据与正文 */
  async updateArticle(id: string, dto: UpdateArticleDto): Promise<AdminArticleDetail> {
    const existing = await this.prisma.libraryArticle.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'article_not_found',
      });
    }

    if (dto.slug !== undefined) {
      const slug = dto.slug.trim();
      const slugResult = validateSlug(slug);
      if (!slugResult.ok) {
        this.validationToBadRequest(slugResult.message);
      }
      if (slug !== existing.slug) {
        await this.ensureSlugAvailable(slug, id);
      }
    }

    if (dto.category !== undefined && !validateCategory(dto.category)) {
      this.validationToBadRequest('category_invalid');
    }

    if (dto.excerpt !== undefined) {
      const excerptResult = this.validateExcerpt(dto.excerpt);
      if (!excerptResult.ok) {
        this.validationToBadRequest(excerptResult.message);
      }
    }

    if (dto.title !== undefined && (!dto.title.trim() || dto.title.trim().length > 120)) {
      this.validationToBadRequest('title_invalid');
    }

    try {
      const row = await this.prisma.libraryArticle.update({
        where: { id },
        data: {
          title: dto.title?.trim(),
          slug: dto.slug?.trim(),
          bodyMd: dto.bodyMd,
          excerpt: dto.excerpt === undefined ? undefined : dto.excerpt?.trim() || null,
          category: dto.category,
          tags: dto.tags === undefined ? undefined : normalizeTags(dto.tags),
        },
      });
      return this.mapArticle(row);
    } catch (e: unknown) {
      if (this.isUniqueViolation(e)) {
        throw new ConflictException({
          success: false,
          data: null,
          message: 'slug_taken',
        });
      }
      throw e;
    }
  }

  /** 硬删文章；已发布须先下架 */
  async deleteArticle(id: string): Promise<{ deleted: true }> {
    const existing = await this.prisma.libraryArticle.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'article_not_found',
      });
    }
    if (existing.isPublished) {
      throw new ConflictException({
        success: false,
        data: null,
        message: 'article_still_published',
      });
    }
    await this.prisma.libraryArticle.delete({ where: { id } });
    return { deleted: true };
  }

  /** 发布文章：校验 title/slug/body/category 后写入 publishedAt */
  async publishArticle(id: string): Promise<AdminArticleDetail> {
    const existing = await this.getArticle(id);
    const result = validateArticleForPublish({
      title: existing.title,
      slug: existing.slug,
      bodyMd: existing.bodyMd,
      category: existing.category,
    });
    if (!result.ok) {
      this.validationToBadRequest(result.message);
    }

    const row = await this.prisma.libraryArticle.update({
      where: { id },
      data: { isPublished: true, publishedAt: new Date() },
    });
    return this.mapArticle(row);
  }

  /** 下架文章（保留 publishedAt 历史） */
  async unpublishArticle(id: string): Promise<AdminArticleDetail> {
    const existing = await this.prisma.libraryArticle.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'article_not_found',
      });
    }

    const row = await this.prisma.libraryArticle.update({
      where: { id },
      data: { isPublished: false },
    });
    return this.mapArticle(row);
  }

  private mapArticle(row: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    bodyMd: string;
    category: string;
    tags: string[];
    isPublished: boolean;
    publishedAt: Date | null;
  }): AdminArticleDetail {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      bodyMd: row.bodyMd,
      category: row.category,
      tags: row.tags,
      isPublished: row.isPublished,
      publishedAt: row.publishedAt?.toISOString() ?? null,
    };
  }

  private validateExcerpt(
    excerpt: string | null | undefined,
  ): { ok: true } | { ok: false; message: string } {
    if (excerpt === undefined || excerpt === null) {
      return { ok: true };
    }
    const trimmed = excerpt.trim();
    if (trimmed.length > 300) {
      return { ok: false, message: 'excerpt_too_long' };
    }
    return { ok: true };
  }

  private async ensureSlugAvailable(slug: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.libraryArticle.findUnique({ where: { slug } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException({
        success: false,
        data: null,
        message: 'slug_taken',
      });
    }
  }

  private isUniqueViolation(e: unknown): boolean {
    return (
      typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002'
    );
  }
}
