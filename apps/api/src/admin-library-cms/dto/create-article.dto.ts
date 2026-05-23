/**
 * Admin 图书馆 CMS DTO：创建文章。
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { LIBRARY_CATEGORIES } from '../../library/library.types';

export class CreateArticleDto {
  @ApiProperty({ description: '文章标题' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ description: 'URL slug（小写 kebab-case）' })
  @IsString()
  @MinLength(1)
  slug!: string;

  @ApiProperty({ description: 'Markdown 正文' })
  @IsString()
  bodyMd!: string;

  @ApiPropertyOptional({ description: '摘要' })
  @IsOptional()
  @IsString()
  excerpt?: string | null;

  @ApiPropertyOptional({ enum: LIBRARY_CATEGORIES, default: 'theory' })
  @IsOptional()
  @IsIn([...LIBRARY_CATEGORIES])
  category?: string;

  @ApiPropertyOptional({ type: [String], description: '标签列表' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
