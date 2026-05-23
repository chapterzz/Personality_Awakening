/**
 * 精灵文案公开 HTTP 接口（T4.7）：GET /sprite-prompts。
 */
import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SpritePromptService } from './sprite-prompt.service';

@ApiTags('sprite-prompt')
@Controller('sprite-prompts')
export class SpritePromptController {
  constructor(private readonly service: SpritePromptService) {}

  @Get()
  @Header('Cache-Control', 'no-cache')
  @ApiOperation({ summary: '获取已发布精灵互动文案' })
  async getPrompts() {
    const data = await this.service.getPublishedPromptsOrThrow();
    return { success: true, data, message: 'ok' };
  }
}
