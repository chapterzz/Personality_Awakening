/**
 * Admin 图书馆 CMS DTO：更新文章（部分字段）。
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { LIBRARY_CATEGORIES } from '../../library/library.types';

export class UpdateArticleDto {
  @ApiPropertyOptional({ description: '文章标题' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional({ description: 'URL slug' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  slug?: string;

  @ApiPropertyOptional({ description: 'Markdown 正文' })
  @IsOptional()
  @IsString()
  bodyMd?: string;

  @ApiPropertyOptional({ description: '摘要' })
  @IsOptional()
  @IsString()
  excerpt?: string | null;

  @ApiPropertyOptional({ enum: LIBRARY_CATEGORIES })
  @IsOptional()
  @IsIn([...LIBRARY_CATEGORIES])
  category?: string;

  @ApiPropertyOptional({ type: [String], description: '标签列表' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
