/**
 * 自适应题序生成请求体 DTO（T2.7）。
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class GenerateSequenceDto {
  @ApiPropertyOptional({ description: '已作答的答案映射（questionId → optionId），用于自适应选题' })
  @IsOptional()
  @IsObject()
  answers?: Record<string, string | number>;
}
