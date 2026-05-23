/**
 * Admin 题库导入 query 参数：格式、dry_run、冲突策略与发布选项。
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

/** 导入/导出文件格式 */
export type QuestionnaireExportFormat = 'json' | 'csv';

export class ImportQuestionnaireQueryDto {
  @ApiProperty({ enum: ['json', 'csv'], description: '与上传文件一致的格式' })
  @IsIn(['json', 'csv'])
  format!: QuestionnaireExportFormat;

  @ApiPropertyOptional({ description: 'true 时仅解析校验与冲突检测，不写库' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  dry_run?: boolean;

  @ApiPropertyOptional({ enum: ['overwrite', 'create_new', 'cancel'], description: 'ID 冲突策略' })
  @IsOptional()
  @IsEnum(['overwrite', 'create_new', 'cancel'])
  on_conflict?: 'overwrite' | 'create_new' | 'cancel';

  @ApiPropertyOptional({ description: '导入成功后是否立即发布' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  publish_after?: boolean;

  @ApiPropertyOptional({ description: 'create_new 时追加的后缀（{id}-import-{suffix}）' })
  @IsOptional()
  @IsString()
  new_id_suffix?: string;
}

export class ExportQuestionnaireQueryDto {
  @ApiProperty({ enum: ['json', 'csv'] })
  @IsIn(['json', 'csv'])
  format!: QuestionnaireExportFormat;
}
