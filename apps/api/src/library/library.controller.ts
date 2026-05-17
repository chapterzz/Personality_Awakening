/**
 * 科普图书馆 HTTP 接口：公开只读列表与详情（T4.1）。
 */
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';
import { LibraryService } from './library.service';

@ApiTags('library')
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get('articles')
  @ApiOperation({ summary: '获取已发布文章列表（可按分类/标签筛选）' })
  async list(@Query() query: ListArticlesQueryDto) {
    const data = await this.libraryService.findPublishedList({
      category: query.category,
      tag: query.tag,
    });
    return { success: true, data, message: 'ok' };
  }

  @Get('articles/:slug')
  @ApiOperation({ summary: '按 slug 获取已发布文章详情' })
  async detail(@Param('slug') slug: string) {
    const data = await this.libraryService.findPublishedBySlug(slug);
    return { success: true, data, message: 'ok' };
  }
}
