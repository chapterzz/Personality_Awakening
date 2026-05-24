/**
 * 自适应题序生成请求体 DTO：随机抽题 / 沿用上次题序。
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';

export class GenerateSequenceDto {
  @ApiPropertyOptional({ enum: ['shuffle', 'reuse'], default: 'shuffle' })
  @IsOptional()
  @IsIn(['shuffle', 'reuse'])
  strategy?: 'shuffle' | 'reuse';

  @ApiPropertyOptional({ description: 'reuse 时传入上次 ordered_question_ids' })
  @ValidateIf((o: GenerateSequenceDto) => o.strategy === 'reuse')
  @IsArray()
  @IsString({ each: true })
  previous_ordered_question_ids?: string[];
}
