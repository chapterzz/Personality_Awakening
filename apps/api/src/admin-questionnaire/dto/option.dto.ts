/**
 * 选项 CRUD DTO（含 dimension / side / weight 计分元数据）。
 */
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateOptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  id!: string;

  @IsString()
  @MinLength(1)
  label!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  valueKey!: string;

  @IsOptional()
  @IsString()
  dimension?: string | null;

  @IsOptional()
  @IsString()
  side?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  weight?: number | null;
}

export class UpdateOptionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  label?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  valueKey?: string;

  @IsOptional()
  @IsString()
  dimension?: string | null;

  @IsOptional()
  @IsString()
  side?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  weight?: number | null;
}
