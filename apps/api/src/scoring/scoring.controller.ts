/**
 * MBTI 计分 HTTP 接口：POST `/scoring/mbti`。
 */
import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ComputeMbtiDto } from './dto/compute-mbti.dto';
import { ScoringService } from './scoring.service';
import { MbtiMode, MbtiSignal } from './scoring.types';

@ApiTags('scoring')
@Controller('scoring')
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Post('mbti')
  @ApiOperation({ summary: '计算 MBTI 维度分值与类型（T2.4）' })
  computeMbti(@Body() body: ComputeMbtiDto) {
    const signals: MbtiSignal[] = body.signals ?? [];
    if (signals.length === 0) {
      return this.badRequest('signals_required');
    }
    if (body.mode !== 'STANDARD' && body.mode !== 'AVG') {
      return this.badRequest('mode_required');
    }
    const data = this.scoringService.computeMbtiScores(body.mode as MbtiMode, signals);
    return {
      success: true,
      data,
      message: 'ok',
    };
  }

  private badRequest(message: string) {
    throw new BadRequestException({
      success: false,
      data: null,
      message,
    });
  }
}
