/**
 * 精灵文案公开消费服务（T4.7）：仅返回已发布配置。
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type PublishedSpritePrompts = {
  hesitationLines: string[];
  mutexLines: Record<string, string[]>;
};

@Injectable()
export class SpritePromptService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取已发布精灵文案；未发布时返回 null。
   */
  async getPublishedPrompts(): Promise<PublishedSpritePrompts | null> {
    const row = await this.prisma.spritePromptConfig.findFirst({
      where: { id: 'default', isPublished: true },
    });
    if (!row) {
      return null;
    }
    return {
      hesitationLines: row.hesitationLines as string[],
      mutexLines: row.mutexLines as Record<string, string[]>,
    };
  }

  /** 获取已发布精灵文案；未发布则抛 404 envelope。 */
  async getPublishedPromptsOrThrow(): Promise<PublishedSpritePrompts> {
    const data = await this.getPublishedPrompts();
    if (!data) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'sprite_prompts_not_found',
      });
    }
    return data;
  }
}
