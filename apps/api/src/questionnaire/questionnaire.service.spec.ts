/**
 * QuestionnaireService 单测：随机 48 题题序生成与 reuse 校验。
 */
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PER_DIMENSION_COUNT, PRESENTED_COUNT, DIMENSIONS } from './random-sequence.util';
import { QuestionnaireService } from './questionnaire.service';
import { PrismaService } from '../prisma/prisma.service';

function mkQuestions(perDim: number, questionnaireId = 'q1') {
  const questions: Array<{ id: string; dimension: string; sortOrder: number }> = [];
  let sortOrder = 1;
  for (const dim of DIMENSIONS) {
    for (let i = 1; i <= perDim; i++) {
      questions.push({
        id: `${dim.toLowerCase()}-${String(i).padStart(2, '0')}`,
        dimension: dim,
        sortOrder: sortOrder++,
      });
    }
  }
  return questions.map((q) => ({ ...q, questionnaireId }));
}

describe('QuestionnaireService', () => {
  let service: QuestionnaireService;
  let prisma: { standardQuestion: { findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      standardQuestion: { findMany: jest.fn() },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestionnaireService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(QuestionnaireService);
  });

  it('shuffle 返回 48 题，每维度 12 题，无重复', async () => {
    prisma.standardQuestion.findMany.mockResolvedValue(mkQuestions(24));
    const ids = await service.generateOrderedQuestionIds('q1', { strategy: 'shuffle' });
    expect(ids).toHaveLength(PRESENTED_COUNT);
    expect(new Set(ids).size).toBe(PRESENTED_COUNT);
    for (const dim of DIMENSIONS) {
      const prefix = `${dim.toLowerCase()}-`;
      expect(ids.filter((id) => id.startsWith(prefix))).toHaveLength(PER_DIMENSION_COUNT);
    }
  });

  it('题池不足时抛 insufficient_questions', async () => {
    prisma.standardQuestion.findMany.mockResolvedValue(mkQuestions(8));
    await expect(service.generateOrderedQuestionIds('q1')).rejects.toThrow(BadRequestException);
  });

  it('reuse 合法时返回相同题序', async () => {
    const pool = mkQuestions(12);
    prisma.standardQuestion.findMany.mockResolvedValue(pool);
    const previous = DIMENSIONS.flatMap((d) =>
      pool
        .filter((q) => q.dimension === d)
        .slice(0, PER_DIMENSION_COUNT)
        .map((q) => q.id),
    );
    const ids = await service.generateOrderedQuestionIds('q1', {
      strategy: 'reuse',
      previousOrderedQuestionIds: previous,
    });
    expect(ids).toEqual(previous);
  });

  it('reuse 长度不对时抛 invalid_reuse_sequence', async () => {
    prisma.standardQuestion.findMany.mockResolvedValue(mkQuestions(12));
    await expect(
      service.generateOrderedQuestionIds('q1', {
        strategy: 'reuse',
        previousOrderedQuestionIds: ['a'],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('无题目时返回空数组', async () => {
    prisma.standardQuestion.findMany.mockResolvedValue([]);
    const ids = await service.generateOrderedQuestionIds('q1');
    expect(ids).toEqual([]);
  });
});
