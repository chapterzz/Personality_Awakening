/**
 * 问卷 HTTP 接口（T2.7）：
 * - GET /questionnaire/published/active — 当前生效的已发布问卷
 * - GET /questionnaire/:id — 获取问卷结构
 * - POST /questionnaire/:id/sequence — 生成随机 48 题题序
 */
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { GenerateSequenceDto } from './dto/generate-sequence.dto';
import { QuestionnaireService } from './questionnaire.service';

@ApiTags('questionnaire')
@Controller('questionnaire')
export class QuestionnaireController {
  constructor(private readonly service: QuestionnaireService) {}

  @Get('published/active')
  @ApiOperation({ summary: '获取当前生效的已发布问卷（最新 publishedAt）' })
  async getActivePublishedQuestionnaire() {
    const data = await this.service.getActivePublishedQuestionnaire();
    return {
      success: true,
      data: {
        id: data.id,
        title: data.title,
        published_at: data.publishedAt?.toISOString() ?? null,
      },
      message: 'ok',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取问卷结构（题目 + 选项）' })
  @ApiParam({ name: 'id', description: '问卷 ID' })
  async getQuestionnaire(@Param('id') id: string) {
    const data = await this.service.getPublishedQuestionnaire(id);
    return {
      success: true,
      data: {
        id: data.id,
        title: data.title,
        questions: data.questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          dimension: q.dimension,
          groupTag: q.groupTag,
          options: q.options.map((o) => ({
            id: o.id,
            label: o.label,
            valueKey: o.valueKey,
            dimension: o.dimension,
            side: o.side,
            weight: o.weight,
          })),
        })),
      },
      message: 'ok',
    };
  }

  @Post(':id/sequence')
  @ApiOperation({ summary: '生成随机 48 题题序（分层抽样 + 全局洗牌）' })
  @ApiParam({ name: 'id', description: '问卷 ID' })
  async generateSequence(@Param('id') id: string, @Body() body: GenerateSequenceDto) {
    const orderedQuestionIds = await this.service.generateOrderedQuestionIds(id, {
      strategy: body.strategy ?? 'shuffle',
      previousOrderedQuestionIds: body.previous_ordered_question_ids,
    });
    return {
      success: true,
      data: {
        questionnaire_id: id,
        ordered_question_ids: orderedQuestionIds,
      },
      message: 'ok',
    };
  }
}
