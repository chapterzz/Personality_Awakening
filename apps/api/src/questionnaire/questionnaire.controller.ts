/**
 * 问卷 HTTP 接口（T2.7）：
 * - GET /questionnaire/:id — 获取问卷结构
 * - POST /questionnaire/:id/sequence — 生成自适应题序
 */
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { GenerateSequenceDto } from './dto/generate-sequence.dto';
import { QuestionnaireService } from './questionnaire.service';

@ApiTags('questionnaire')
@Controller('questionnaire')
export class QuestionnaireController {
  constructor(private readonly service: QuestionnaireService) {}

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
  @ApiOperation({ summary: '生成自适应题序（T2.7）' })
  @ApiParam({ name: 'id', description: '问卷 ID' })
  async generateSequence(@Param('id') id: string, @Body() body: GenerateSequenceDto) {
    const orderedQuestionIds = await this.service.generateOrderedQuestionIds(id, body.answers);
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
