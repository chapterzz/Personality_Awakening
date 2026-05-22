/**
 * 创建/更新问卷 DTO。
 */
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateQuestionnaireDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  id!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;
}

export class UpdateQuestionnaireDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;
}
