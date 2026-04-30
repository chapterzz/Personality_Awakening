/**
 * QuestionnaireService 单测：自适应题序规则引擎验证（T2.7）。
 */
import { Test, TestingModule } from '@nestjs/testing';
import { QuestionnaireService } from './questionnaire.service';
import { PrismaService } from '../prisma/prisma.service';

const mockQuestions = [
  {
    id: 'sq01',
    prompt: 'EI screening',
    sortOrder: 1,
    dimension: 'EI',
    groupTag: 'screening',
    groupSortOrder: 1,
    questionnaireId: 'q1',
    options: [
      {
        id: 'sq01_A',
        label: 'E',
        valueKey: 'sq01_A',
        dimension: 'EI',
        side: 'E',
        weight: 2,
        questionId: 'sq01',
      },
      {
        id: 'sq01_B',
        label: 'I',
        valueKey: 'sq01_B',
        dimension: 'EI',
        side: 'I',
        weight: 2,
        questionId: 'sq01',
      },
    ],
  },
  {
    id: 'sq02',
    prompt: 'SN screening',
    sortOrder: 2,
    dimension: 'SN',
    groupTag: 'screening',
    groupSortOrder: 1,
    questionnaireId: 'q1',
    options: [
      {
        id: 'sq02_A',
        label: 'S',
        valueKey: 'sq02_A',
        dimension: 'SN',
        side: 'S',
        weight: 2,
        questionId: 'sq02',
      },
      {
        id: 'sq02_B',
        label: 'N',
        valueKey: 'sq02_B',
        dimension: 'SN',
        side: 'N',
        weight: 2,
        questionId: 'sq02',
      },
    ],
  },
  {
    id: 'sq03',
    prompt: 'TF screening',
    sortOrder: 3,
    dimension: 'TF',
    groupTag: 'screening',
    groupSortOrder: 1,
    questionnaireId: 'q1',
    options: [
      {
        id: 'sq03_A',
        label: 'T',
        valueKey: 'sq03_A',
        dimension: 'TF',
        side: 'T',
        weight: 2,
        questionId: 'sq03',
      },
      {
        id: 'sq03_B',
        label: 'F',
        valueKey: 'sq03_B',
        dimension: 'TF',
        side: 'F',
        weight: 2,
        questionId: 'sq03',
      },
    ],
  },
  {
    id: 'sq04',
    prompt: 'JP screening',
    sortOrder: 4,
    dimension: 'JP',
    groupTag: 'screening',
    groupSortOrder: 1,
    questionnaireId: 'q1',
    options: [
      {
        id: 'sq04_A',
        label: 'J',
        valueKey: 'sq04_A',
        dimension: 'JP',
        side: 'J',
        weight: 2,
        questionId: 'sq04',
      },
      {
        id: 'sq04_B',
        label: 'P',
        valueKey: 'sq04_B',
        dimension: 'JP',
        side: 'P',
        weight: 2,
        questionId: 'sq04',
      },
    ],
  },
  // EI follow-up
  {
    id: 'sq05',
    prompt: 'EI followup 1',
    sortOrder: 5,
    dimension: 'EI',
    groupTag: 'ei_followup',
    groupSortOrder: 1,
    questionnaireId: 'q1',
    options: [
      {
        id: 'sq05_A',
        label: 'E',
        valueKey: 'sq05_A',
        dimension: 'EI',
        side: 'E',
        weight: 2,
        questionId: 'sq05',
      },
      {
        id: 'sq05_B',
        label: 'I',
        valueKey: 'sq05_B',
        dimension: 'EI',
        side: 'I',
        weight: 2,
        questionId: 'sq05',
      },
    ],
  },
  {
    id: 'sq06',
    prompt: 'EI followup 2',
    sortOrder: 6,
    dimension: 'EI',
    groupTag: 'ei_followup',
    groupSortOrder: 2,
    questionnaireId: 'q1',
    options: [
      {
        id: 'sq06_A',
        label: 'E',
        valueKey: 'sq06_A',
        dimension: 'EI',
        side: 'E',
        weight: 2,
        questionId: 'sq06',
      },
      {
        id: 'sq06_B',
        label: 'I',
        valueKey: 'sq06_B',
        dimension: 'EI',
        side: 'I',
        weight: 2,
        questionId: 'sq06',
      },
    ],
  },
  // SN follow-up
  {
    id: 'sq07',
    prompt: 'SN followup 1',
    sortOrder: 7,
    dimension: 'SN',
    groupTag: 'sn_followup',
    groupSortOrder: 1,
    questionnaireId: 'q1',
    options: [
      {
        id: 'sq07_A',
        label: 'S',
        valueKey: 'sq07_A',
        dimension: 'SN',
        side: 'S',
        weight: 2,
        questionId: 'sq07',
      },
      {
        id: 'sq07_B',
        label: 'N',
        valueKey: 'sq07_B',
        dimension: 'SN',
        side: 'N',
        weight: 2,
        questionId: 'sq07',
      },
    ],
  },
  {
    id: 'sq08',
    prompt: 'SN followup 2',
    sortOrder: 8,
    dimension: 'SN',
    groupTag: 'sn_followup',
    groupSortOrder: 2,
    questionnaireId: 'q1',
    options: [
      {
        id: 'sq08_A',
        label: 'S',
        valueKey: 'sq08_A',
        dimension: 'SN',
        side: 'S',
        weight: 2,
        questionId: 'sq08',
      },
      {
        id: 'sq08_B',
        label: 'N',
        valueKey: 'sq08_B',
        dimension: 'SN',
        side: 'N',
        weight: 2,
        questionId: 'sq08',
      },
    ],
  },
  // TF follow-up
  {
    id: 'sq09',
    prompt: 'TF followup 1',
    sortOrder: 9,
    dimension: 'TF',
    groupTag: 'tf_followup',
    groupSortOrder: 1,
    questionnaireId: 'q1',
    options: [
      {
        id: 'sq09_A',
        label: 'T',
        valueKey: 'sq09_A',
        dimension: 'TF',
        side: 'T',
        weight: 2,
        questionId: 'sq09',
      },
      {
        id: 'sq09_B',
        label: 'F',
        valueKey: 'sq09_B',
        dimension: 'TF',
        side: 'F',
        weight: 2,
        questionId: 'sq09',
      },
    ],
  },
  {
    id: 'sq10',
    prompt: 'TF followup 2',
    sortOrder: 10,
    dimension: 'TF',
    groupTag: 'tf_followup',
    groupSortOrder: 2,
    questionnaireId: 'q1',
    options: [
      {
        id: 'sq10_A',
        label: 'T',
        valueKey: 'sq10_A',
        dimension: 'TF',
        side: 'T',
        weight: 2,
        questionId: 'sq10',
      },
      {
        id: 'sq10_B',
        label: 'F',
        valueKey: 'sq10_B',
        dimension: 'TF',
        side: 'F',
        weight: 2,
        questionId: 'sq10',
      },
    ],
  },
  // JP follow-up
  {
    id: 'sq11',
    prompt: 'JP followup 1',
    sortOrder: 11,
    dimension: 'JP',
    groupTag: 'jp_followup',
    groupSortOrder: 1,
    questionnaireId: 'q1',
    options: [
      {
        id: 'sq11_A',
        label: 'J',
        valueKey: 'sq11_A',
        dimension: 'JP',
        side: 'J',
        weight: 2,
        questionId: 'sq11',
      },
      {
        id: 'sq11_B',
        label: 'P',
        valueKey: 'sq11_B',
        dimension: 'JP',
        side: 'P',
        weight: 2,
        questionId: 'sq11',
      },
    ],
  },
  {
    id: 'sq12',
    prompt: 'JP followup 2',
    sortOrder: 12,
    dimension: 'JP',
    groupTag: 'jp_followup',
    groupSortOrder: 2,
    questionnaireId: 'q1',
    options: [
      {
        id: 'sq12_A',
        label: 'J',
        valueKey: 'sq12_A',
        dimension: 'JP',
        side: 'J',
        weight: 2,
        questionId: 'sq12',
      },
      {
        id: 'sq12_B',
        label: 'P',
        valueKey: 'sq12_B',
        dimension: 'JP',
        side: 'P',
        weight: 2,
        questionId: 'sq12',
      },
    ],
  },
];

describe('QuestionnaireService', () => {
  let service: QuestionnaireService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionnaireService,
        {
          provide: PrismaService,
          useValue: {
            standardQuestionnaire: {
              findFirst: jest
                .fn()
                .mockResolvedValue({ id: 'q1', title: 'Test', isPublished: true }),
            },
            standardQuestion: {
              findMany: jest.fn().mockResolvedValue(mockQuestions),
            },
          },
        },
      ],
    }).compile();

    service = module.get<QuestionnaireService>(QuestionnaireService);
  });

  it('无答案时返回 screening 题目并填充至 TARGET_COUNT', async () => {
    const ids = await service.generateOrderedQuestionIds('q1');
    // screening 有 4 题，无答案时无追问，但会填充到 12 题
    expect(ids).toHaveLength(12);
    expect(ids.slice(0, 4)).toEqual(['sq01', 'sq02', 'sq03', 'sq04']);
  });

  it('EI 信号弱时追加 EI follow-up 题目', async () => {
    // sq01 选了 E（weight=2），无其他答案 → EI delta=2（刚好不弱）
    // 但如果只选了 sq01_A（E weight=2），I=0，delta=2，阈值是 2，不算弱
    // 需要 delta < 2 才算弱，所以选一个 weight=1 的情况
    // 当前 seed weight 都是 2，所以选 E 后 delta=2，不算弱
    // 测试：不选任何 EI 题，EI 无信号 → 弱
    const ids = await service.generateOrderedQuestionIds('q1', {
      sq02: 'sq02_A', // SN: S=2, N=0, delta=2, not weak
      sq03: 'sq03_A', // TF: T=2, F=0, delta=2, not weak
      sq04: 'sq04_A', // JP: J=2, P=0, delta=2, not weak
    });
    // EI 无信号 → 弱 → 追加 sq05, sq06
    expect(ids).toContain('sq05');
    expect(ids).toContain('sq06');
    // 前 4 题始终是 screening
    expect(ids.slice(0, 4)).toEqual(['sq01', 'sq02', 'sq03', 'sq04']);
    // sq05, sq06 紧随其后
    expect(ids[4]).toBe('sq05');
    expect(ids[5]).toBe('sq06');
  });

  it('所有维度信号强时填充剩余 follow-up', async () => {
    const ids = await service.generateOrderedQuestionIds('q1', {
      sq01: 'sq01_A', // EI: E=2, I=0, delta=2, not weak
      sq02: 'sq02_A', // SN: S=2, N=0, delta=2, not weak
      sq03: 'sq03_A', // TF: T=2, F=0, delta=2, not weak
      sq04: 'sq04_A', // JP: J=2, P=0, delta=2, not weak
    });
    expect(ids).toHaveLength(12);
    // 所有维度不弱，按 sortOrder 填充 follow-up
    expect(ids.slice(0, 4)).toEqual(['sq01', 'sq02', 'sq03', 'sq04']);
  });

  it('始终返回不超过 TARGET_COUNT 题', async () => {
    const ids = await service.generateOrderedQuestionIds('q1');
    expect(ids.length).toBeLessThanOrEqual(12);
  });
});
