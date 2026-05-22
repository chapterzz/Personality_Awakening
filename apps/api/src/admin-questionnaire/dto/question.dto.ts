/**
 * 题目 CRUD DTO（含 T2.7 groupTag / dimension 字段）。
 */
import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  id!: string;

  @IsString()
  @MinLength(1)
  prompt!: string;

  @IsInt()
  @Min(0)
  sortOrder!: number;

  @IsOptional()
  @IsString()
  dimension?: string | null;

  @IsOptional()
  @IsString()
  groupTag?: string | null;

  @IsOptional()
  @IsInt()
  groupSortOrder?: number | null;
}

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  prompt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  dimension?: string | null;

  @IsOptional()
  @IsString()
  groupTag?: string | null;

  @IsOptional()
  @IsInt()
  groupSortOrder?: number | null;
}
