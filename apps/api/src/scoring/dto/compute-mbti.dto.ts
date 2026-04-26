/**
 * MBTI 计分请求 DTO：统一接收 STANDARD/AVG 的计分信号序列。
 */
import { AssessmentMode } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsIn, IsInt, Max, Min, ValidateNested } from 'class-validator';

const MBTI_DIMENSIONS = ['EI', 'SN', 'TF', 'JP'] as const;
const MBTI_SIDES = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'] as const;

export class MbtiSignalDto {
  @IsIn(MBTI_DIMENSIONS)
  dimension!: (typeof MBTI_DIMENSIONS)[number];

  @IsIn(MBTI_SIDES)
  side!: (typeof MBTI_SIDES)[number];

  @IsInt()
  @Min(1)
  @Max(3)
  weight!: 1 | 2 | 3;
}

export class ComputeMbtiDto {
  @IsEnum(AssessmentMode)
  mode!: AssessmentMode;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MbtiSignalDto)
  signals!: MbtiSignalDto[];
}
