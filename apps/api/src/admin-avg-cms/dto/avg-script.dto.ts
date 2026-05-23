/**
 * Admin AVG CMS DTO：创建/更新脚本元数据。
 */
import { IsString, MinLength } from 'class-validator';

export class CreateAvgScriptDto {
  @IsString()
  @MinLength(1)
  id!: string;

  @IsString()
  @MinLength(1)
  title!: string;
}

export class UpdateAvgScriptDto {
  @IsString()
  @MinLength(1)
  title!: string;
}
