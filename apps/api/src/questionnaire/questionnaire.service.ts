/**
 * 问卷服务：查询问卷结构、实现自适应题序规则引擎（T2.7）。
 * 规则：筛选轮（screening）→ 弱信号维度追问轮（follow-up），总题数固定为 TARGET_COUNT。
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** 维度标签 */
type Dimension = 'EI' | 'SN' | 'TF' | 'JP';

/** 维度对应的两侧 */
const DIMENSION_SIDES: Record<Dimension, [string, string]> = {
  EI: ['E', 'I'],
  SN: ['S', 'N'],
  TF: ['T', 'F'],
  JP: ['J', 'P'],
};

/** 目标总题数 */
const TARGET_COUNT = 12;

/** 弱信号阈值：两侧分差小于此值时判定需要追问 */
const WEAK_SIGNAL_THRESHOLD = 2;

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
   * 自适应题序生成：根据已作答答案，生成 ordered_question_ids。
   * - 始终包含 screening 题目
   * - 对信号弱的维度追加 follow-up 题目
   * - 不足 TARGET_COUNT 时用剩余 follow-up 填充
   */
  async generateOrderedQuestionIds(
    questionnaireId: string,
    existingAnswers?: Record<string, string | number>,
  ): Promise<string[]> {
    const questions = await this.prisma.standardQuestion.findMany({
      where: { questionnaireId },
      orderBy: { sortOrder: 'asc' },
      include: { options: true },
    });

    if (questions.length === 0) {
      return [];
    }

    // 按分组归类
    const screening = questions.filter((q) => q.groupTag === 'screening');
    const followups = questions.filter((q) => q.groupTag && q.groupTag !== 'screening');

    // 筛选轮始终在前
    const ordered: string[] = screening.map((q) => q.id);

    // 若有已答答案，评估哪些维度需要追问
    if (existingAnswers && Object.keys(existingAnswers).length > 0) {
      const signals = this.extractSignals(questions, existingAnswers);
      const weakDimensions = this.findWeakDimensions(signals);

      for (const dim of weakDimensions) {
        const dimFollowups = followups
          .filter((q) => q.dimension === dim)
          .sort((a, b) => (a.groupSortOrder ?? 0) - (b.groupSortOrder ?? 0));
        for (const q of dimFollowups) {
          if (!ordered.includes(q.id)) {
            ordered.push(q.id);
          }
        }
      }
    }

    // 填充剩余题目至 TARGET_COUNT
    for (const q of followups) {
      if (ordered.length >= TARGET_COUNT) break;
      if (!ordered.includes(q.id)) {
        ordered.push(q.id);
      }
    }

    return ordered;
  }

  /**
   * 从已答答案中提取各维度的两侧分值。
   */
  private extractSignals(
    questions: Array<{
      id: string;
      options: Array<{
        id: string;
        dimension: string | null;
        side: string | null;
        weight: number | null;
      }>;
    }>,
    answers: Record<string, string | number>,
  ): Record<string, Record<string, number>> {
    const scores: Record<string, Record<string, number>> = {};

    for (const question of questions) {
      const answerId = answers[question.id];
      if (answerId === undefined) continue;

      const option = question.options.find((o) => o.id === String(answerId));
      if (!option || !option.dimension || !option.side || !option.weight) continue;

      if (!scores[option.dimension]) {
        scores[option.dimension] = {};
      }
      const dimScores = scores[option.dimension];
      dimScores[option.side] = (dimScores[option.side] ?? 0) + option.weight;
    }

    return scores;
  }

  /**
   * 找出信号弱的维度（两侧分差 < WEAK_SIGNAL_THRESHOLD）。
   */
  private findWeakDimensions(signals: Record<string, Record<string, number>>): Dimension[] {
    const weak: Dimension[] = [];

    for (const dim of Object.keys(DIMENSION_SIDES) as Dimension[]) {
      const sides = DIMENSION_SIDES[dim];
      const dimScores = signals[dim];
      if (!dimScores) {
        // 该维度无信号，视为弱
        weak.push(dim);
        continue;
      }
      const scoreA = dimScores[sides[0]] ?? 0;
      const scoreB = dimScores[sides[1]] ?? 0;
      if (Math.abs(scoreA - scoreB) < WEAK_SIGNAL_THRESHOLD) {
        weak.push(dim);
      }
    }

    return weak;
  }
}
