/**
 * 问卷服务：查询问卷结构、生成标准模式随机 48 题题序。
 * 规则：每维度 12 题分层随机 → 全局洗牌；支持 reuse 沿用上次题序。
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  groupQuestionsByDimension,
  pickStratifiedRandomIds,
  validateDimensionPools,
  validateReuseIds,
} from './random-sequence.util';

export type GenerateSequenceOptions = {
  strategy?: 'shuffle' | 'reuse';
  previousOrderedQuestionIds?: string[];
};

@Injectable()
export class QuestionnaireService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取已发布问卷的完整结构（题目 + 选项）。
   */
  async getPublishedQuestionnaire(questionnaireId: string) {
    const questionnaire = await this.prisma.standardQuestionnaire.findFirst({
      where: { id: questionnaireId, isPublished: true },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: {
            options: true,
          },
        },
      },
    });

    if (!questionnaire) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'questionnaire_not_found',
      });
    }

    return questionnaire;
  }

  /**
   * 生成 ordered_question_ids：分层随机 48 题或 reuse 上次题序。
   */
  async generateOrderedQuestionIds(
    questionnaireId: string,
    options: GenerateSequenceOptions = {},
  ): Promise<string[]> {
    const questions = await this.prisma.standardQuestion.findMany({
      where: { questionnaireId },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, dimension: true },
    });

    if (questions.length === 0) {
      return [];
    }

    const refs = questions.map((q) => ({ id: q.id, dimension: q.dimension }));
    const grouped = groupQuestionsByDimension(refs);
    validateDimensionPools(grouped);

    const strategy = options.strategy ?? 'shuffle';
    if (strategy === 'reuse' && options.previousOrderedQuestionIds?.length) {
      return validateReuseIds(options.previousOrderedQuestionIds, refs, grouped);
    }

    return pickStratifiedRandomIds(grouped);
  }
}
