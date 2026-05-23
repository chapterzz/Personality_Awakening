/**
 * Admin GET /admin/library/articles 查询参数：分类与发布状态筛选。
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { LIBRARY_CATEGORIES } from '../../library/library.types';

export class AdminListArticlesQueryDto {
  @ApiPropertyOptional({ enum: LIBRARY_CATEGORIES })
  @IsOptional()
  @IsIn([...LIBRARY_CATEGORIES])
  category?: string;

  @ApiPropertyOptional({ description: '是否已发布' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isPublished?: boolean;
}
