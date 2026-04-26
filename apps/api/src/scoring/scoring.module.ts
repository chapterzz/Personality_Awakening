/**
 * 评分模块：对外提供 MBTI 计分 API 与内部算法服务。
 */
import { Module } from '@nestjs/common';
import { ScoringController } from './scoring.controller';
import { ScoringService } from './scoring.service';

@Module({
  controllers: [ScoringController],
  providers: [ScoringService],
  exports: [ScoringService],
})
export class ScoringModule {}
