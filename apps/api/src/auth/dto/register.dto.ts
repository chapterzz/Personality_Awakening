/**
 * POST `/auth/register` 请求体：昵称、密码、可选游客转化与提交载荷。
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssessmentMode } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** 游客在本次请求内一并提交时，写入 `TestResult`（计分由 T2.4 服务化后可改为服务端计算）。 */
export class SubmissionDto {
  @IsEnum(AssessmentMode)
  mode!: AssessmentMode;

  @IsObject()
  scores!: Record<string, unknown>;

  @IsString()
  @MinLength(2)
  @MaxLength(8)
  mbti_type!: string;
}

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  nickname!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({ description: '游客 `temp_session_id`（转化时绑定 `TemporarySession`）' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  guest_session_id?: string;

  @ApiPropertyOptional({
    description:
      '为 true 时：同事务内创建 `TestResult` 并删除游客 `TemporarySession`（须同时提供 `submission`）',
  })
  @IsOptional()
  @IsBoolean()
  finalize_submission?: boolean;

  @ApiPropertyOptional({ type: SubmissionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SubmissionDto)
  submission?: SubmissionDto;
}
