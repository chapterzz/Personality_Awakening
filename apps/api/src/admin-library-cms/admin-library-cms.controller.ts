/**
 * Admin 科普图书馆 CMS HTTP 接口（T4.8）：需 ADMIN JWT。
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminLibraryCmsService } from './admin-library-cms.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { AdminListArticlesQueryDto } from './dto/list-articles-query.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@ApiTags('admin-library')
@ApiBearerAuth()
@Controller('admin/library')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminLibraryCmsController {
  constructor(private readonly service: AdminLibraryCmsService) {}

  @Get('articles')
  @ApiOperation({ summary: '文章列表（含未发布，可按分类/状态筛选）' })
  async list(@Query() query: AdminListArticlesQueryDto) {
    const data = await this.service.listArticles({
      category: query.category,
      isPublished: query.isPublished,
    });
    return { success: true, data, message: 'ok' };
  }

  @Post('articles')
  @ApiOperation({ summary: '创建文章草稿' })
  async create(@Body() dto: CreateArticleDto) {
    const data = await this.service.createArticle(dto);
    return { success: true, data, message: 'ok' };
  }

  @Get('articles/:id')
  @ApiOperation({ summary: '文章详情（含 bodyMd）' })
  async detail(@Param('id') id: string) {
    const data = await this.service.getArticle(id);
    return { success: true, data, message: 'ok' };
  }

  @Patch('articles/:id')
  @ApiOperation({ summary: '更新文章' })
  async update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    const data = await this.service.updateArticle(id, dto);
    return { success: true, data, message: 'ok' };
  }

  @Delete('articles/:id')
  @ApiOperation({ summary: '删除文章（已发布须先下架）' })
  async remove(@Param('id') id: string) {
    const data = await this.service.deleteArticle(id);
    return { success: true, data, message: 'ok' };
  }

  @Post('articles/:id/publish')
  @ApiOperation({ summary: '发布文章' })
  async publish(@Param('id') id: string) {
    const data = await this.service.publishArticle(id);
    return { success: true, data, message: 'ok' };
  }

  @Post('articles/:id/unpublish')
  @ApiOperation({ summary: '下架文章' })
  async unpublish(@Param('id') id: string) {
    const data = await this.service.unpublishArticle(id);
    return { success: true, data, message: 'ok' };
  }
}
