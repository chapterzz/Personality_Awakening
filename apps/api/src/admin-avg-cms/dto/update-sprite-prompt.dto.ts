/**
 * Admin 精灵文案 CMS DTO：更新 hesitationLines + mutexLines。
 */
import { IsArray, IsObject, IsString } from 'class-validator';

export class UpdateSpritePromptDto {
  @IsArray()
  @IsString({ each: true })
  hesitationLines!: string[];

  @IsObject()
  mutexLines!: Record<string, string[]>;
}
