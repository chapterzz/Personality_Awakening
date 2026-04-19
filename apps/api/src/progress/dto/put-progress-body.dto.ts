/**
 * PUT `/progress` 请求体：`progress_data` 与 `if_match_revision`。
 */
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsObject, Min } from 'class-validator';

export class PutProgressBodyDto {
  @ApiProperty({ description: 'PRD §2.4 全量进度 JSON（snake_case）' })
  @IsObject()
  progress_data!: Record<string, unknown>;

  @ApiProperty({
    description: '上次 GET 的 progress_revision；新建会话须传 0（PRD §2.5）',
    example: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  if_match_revision!: number;
}
