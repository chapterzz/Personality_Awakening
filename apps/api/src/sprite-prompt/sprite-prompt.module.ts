/**
 * 精灵文案公开消费模块（T4.7）。
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SpritePromptController } from './sprite-prompt.controller';
import { SpritePromptService } from './sprite-prompt.service';

@Module({
  imports: [PrismaModule],
  controllers: [SpritePromptController],
  providers: [SpritePromptService],
  exports: [SpritePromptService],
})
export class SpritePromptModule {}
