/**
 * GET /library/articles 查询参数 DTO：分类与单标签筛选。
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { LIBRARY_CATEGORIES } from '../library.types';

export class ListArticlesQueryDto {
  @ApiPropertyOptional({ enum: LIBRARY_CATEGORIES, description: '文章分类' })
  @IsOptional()
  @IsIn([...LIBRARY_CATEGORIES])
  category?: string;

  @ApiPropertyOptional({ description: '标签（数组包含匹配）' })
  @IsOptional()
  @IsString()
  tag?: string;
}
