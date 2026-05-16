/**
 * QuestionnaireService 单测：自适应题序规则引擎验证（T2.7）。
 */
import { Test, TestingModule } from '@nestjs/testing';
import { QuestionnaireService } from './questionnaire.service';
import { PrismaService } from '../prisma/prisma.service';

const mockQuestions = [
  // === 筛选轮：每维度 2 题（按 sortOrder 排序） ===

  // EI 维度筛选题 1
  {
    id: 'sq01',
    prompt: 'EI screening 1',
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
        weight: 1,
        questionId: 'sq01',
      },
      {
        id: 'sq01_B',
        label: 'I',
        valueKey: 'sq01_B',
        dimension: 'EI',
        side: 'I',
        weight: 1,
        questionId: 'sq01',
      },
    ],
  },

  // SN 维度筛选题 1
  {
    id: 'sq02',
    prompt: 'SN screening 1',
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
        weight: 1,
        questionId: 'sq02',
      },
      {
        id: 'sq02_B',
        label: 'N',
        valueKey: 'sq02_B',
        dimension: 'SN',
        side: 'N',
        weight: 1,
        questionId: 'sq02',
      },
    ],
  },

  // TF 维度筛选题 1
  {
    id: 'sq03',
    prompt: 'TF screening 1',
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
        weight: 1,
        questionId: 'sq03',
      },
      {
        id: 'sq03_B',
        label: 'F',
        valueKey: 'sq03_B',
        dimension: 'TF',
        side: 'F',
        weight: 1,
        questionId: 'sq03',
      },
    ],
  },

  // JP 维度筛选题 1
  {
    id: 'sq04',
    prompt: 'JP screening 1',
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
        weight: 1,
        questionId: 'sq04',
      },
      {
        id: 'sq04_B',
        label: 'P',
        valueKey: 'sq04_B',
        dimension: 'JP',
        side: 'P',
        weight: 1,
        questionId: 'sq04',
      },
    ],
  },

  // EI 维度筛选题 2
  {
    id: 'sq13',
    prompt: 'EI screening 2',
    sortOrder: 5,
    dimension: 'EI',
    groupTag: 'screening',
    groupSortOrder: 2,
    questionnaireId: 'q1',
    options: [
      {
        id: 'sq13_A',
        label: 'E',
        valueKey: 'sq13_A',
        dimension: 'EI',
        side: 'E',
        weight: 1,
        questionId: 'sq13',
      },
      {
        id: 'sq13_B',
        label: 'I',
        valueKey: 'sq13_B',
        dimension: 'EI',
        side: 'I',
        weight: 1,
        questionId: 'sq13',
      },
    ],
  },

  // SN 维度筛选题 2
  {
    id: 'sq14',
    prompt: 'SN screening 2',
    sortOrder: 6,
    dimension: 'SN',
    groupTag: 'screening',
    groupSortOrder: 2,
    questionnaireId: 'q1',
    options: [
      {
        id: 'sq14_A',
        label: 'S',
        valueKey: 'sq14_A',
        dimension: 'SN',
        side: 'S',
        weight: 1,
        questionId: 'sq14',
      },
      {
        id: 'sq14_B',
        label: 'N',
        valueKey: 'sq14_B',
        dimension: 'SN',
        side: 'N',
        weight: 1,
        questionId: 'sq14',
      },
    ],
  },

  // TF 维度筛选题 2
  {
    id: 'sq15',
    prompt: 'TF screening 2',
    sortOrder: 7,
    dimension: 'TF',
    groupTag: 'screening',
    groupSortOrder: 2,
    questionnaireId: 'q1',
    options: [
      {
        id: 'sq15_A',
        label: 'T',
        valueKey: 'sq15_A',
        dimension: 'TF',
        side: 'T',
        weight: 1,
        questionId: 'sq15',
      },
      {
        id: 'sq15_B',
        label: 'F',
        valueKey: 'sq15_B',
        dimension: 'TF',
        side: 'F',
        weight: 1,
        questionId: 'sq15',
      },
    ],
  },

  // JP 维度筛选题 2
  {
    id: 'sq16',
    prompt: 'JP screening 2',
    sortOrder: 8,
    dimension: 'JP',
    groupTag: 'screening',
    groupSortOrder: 2,
    questionnaireId: 'q1',
    options: [
      {
        id: 'sq16_A',
        label: 'J',
        valueKey: 'sq16_A',
        dimension: 'JP',
        side: 'J',
        weight: 1,
        questionId: 'sq16',
      },
      {
        id: 'sq16_B',
        label: 'P',
        valueKey: 'sq16_B',
        dimension: 'JP',
        side: 'P',
        weight: 1,
        questionId: 'sq16',
      },
    ],
  },

  // === 追问轮：每维度 1 题（按 sortOrder 排序） ===

  // EI 追问轮
  {
    id: 'sq05',
    prompt: 'EI followup',
    sortOrder: 9,
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

  // SN 追问轮
  {
    id: 'sq07',
    prompt: 'SN followup',
    sortOrder: 10,
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

  // TF 追问轮
  {
    id: 'sq09',
    prompt: 'TF followup',
    sortOrder: 11,
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

  // JP 追问轮
  {
    id: 'sq11',
    prompt: 'JP followup',
    sortOrder: 12,
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

  it('无答案时只返回 screening 题目', async () => {
    const ids = await service.generateOrderedQuestionIds('q1');
    // 无答案时只返回 screening 题，等待筛选轮结束后再扩展
    expect(ids).toHaveLength(8);
    expect(ids).toEqual(['sq01', 'sq02', 'sq03', 'sq04', 'sq13', 'sq14', 'sq15', 'sq16']);
  });

  it('全选 A 时所有维度 delta=2，不是弱信号，按 sortOrder 填充', async () => {
    const ids = await service.generateOrderedQuestionIds('q1', {
      sq01: 'sq01_A', // EI: E=1, I=0
      sq13: 'sq13_A', // EI: E=2, I=0, delta=2, not weak
      sq02: 'sq02_A', // SN: S=1, N=0
      sq14: 'sq14_A', // SN: S=2, N=0, delta=2, not weak
      sq03: 'sq03_A', // TF: T=1, F=0
      sq15: 'sq15_A', // TF: T=2, F=0, delta=2, not weak
      sq04: 'sq04_A', // JP: J=1, P=0
      sq16: 'sq16_A', // JP: J=2, P=0, delta=2, not weak
    });
    // 所有维度 delta=2，都不是弱信号，按 sortOrder 填充 follow-up
    expect(ids).toHaveLength(12);
    expect(ids.slice(0, 8)).toEqual([
      'sq01',
      'sq02',
      'sq03',
      'sq04',
      'sq13',
      'sq14',
      'sq15',
      'sq16',
    ]);
    // follow-up 按 sortOrder 填充
    expect(ids.slice(8)).toEqual(['sq05', 'sq07', 'sq09', 'sq11']);
  });

  it('全选 B 时所有维度 delta=2，不是弱信号，按 sortOrder 填充', async () => {
    const ids = await service.generateOrderedQuestionIds('q1', {
      sq01: 'sq01_B', // EI: E=0, I=1
      sq13: 'sq13_B', // EI: E=0, I=2, delta=2, not weak
      sq02: 'sq02_B', // SN: S=0, N=1
      sq14: 'sq14_B', // SN: S=0, N=2, delta=2, not weak
      sq03: 'sq03_B', // TF: T=0, F=1
      sq15: 'sq15_B', // TF: T=0, F=2, delta=2, not weak
      sq04: 'sq04_B', // JP: J=0, P=1
      sq16: 'sq16_B', // JP: J=0, P=2, delta=2, not weak
    });
    // 所有维度 delta=2，都不是弱信号，按 sortOrder 填充 follow-up
    expect(ids).toHaveLength(12);
    expect(ids.slice(0, 8)).toEqual([
      'sq01',
      'sq02',
      'sq03',
      'sq04',
      'sq13',
      'sq14',
      'sq15',
      'sq16',
    ]);
    // follow-up 按 sortOrder 填充
    expect(ids.slice(8)).toEqual(['sq05', 'sq07', 'sq09', 'sq11']);
  });

  it('维度内部混合选择时 delta=0，是弱信号，该维度追问题优先', async () => {
    // EI 维度：sq01选A，sq13选B → E=1, I=1, delta=0，是弱信号
    // 其他维度全选A → delta=2，不是弱信号
    const ids = await service.generateOrderedQuestionIds('q1', {
      sq01: 'sq01_A', // EI: E=1, I=0
      sq13: 'sq13_B', // EI: E=1, I=1, delta=0, weak
      sq02: 'sq02_A', // SN: S=1, N=0
      sq14: 'sq14_A', // SN: S=2, N=0, delta=2, not weak
      sq03: 'sq03_A', // TF: T=1, F=0
      sq15: 'sq15_A', // TF: T=2, F=0, delta=2, not weak
      sq04: 'sq04_A', // JP: J=1, P=0
      sq16: 'sq16_A', // JP: J=2, P=0, delta=2, not weak
    });
    // EI 是弱信号，追问题 sq05 优先于其他维度的追问题
    expect(ids).toHaveLength(12);
    expect(ids.slice(0, 8)).toEqual([
      'sq01',
      'sq02',
      'sq03',
      'sq04',
      'sq13',
      'sq14',
      'sq15',
      'sq16',
    ]);
    // EI 追问题 sq05 在最前面
    expect(ids[8]).toBe('sq05');
  });

  it('多个维度弱信号时，按维度顺序填充追问题', async () => {
    // EI 维度：delta=0，弱信号
    // SN 维度：delta=0，弱信号
    // TF 维度：delta=2，不是弱信号
    // JP 维度：delta=2，不是弱信号
    const ids = await service.generateOrderedQuestionIds('q1', {
      sq01: 'sq01_A', // EI: E=1, I=0
      sq13: 'sq13_B', // EI: E=1, I=1, delta=0, weak
      sq02: 'sq02_A', // SN: S=1, N=0
      sq14: 'sq14_B', // SN: S=1, N=1, delta=0, weak
      sq03: 'sq03_A', // TF: T=1, F=0
      sq15: 'sq15_A', // TF: T=2, F=0, delta=2, not weak
      sq04: 'sq04_A', // JP: J=1, P=0
      sq16: 'sq16_A', // JP: J=2, P=0, delta=2, not weak
    });
    // EI 和 SN 是弱信号，追问题优先
    expect(ids).toHaveLength(12);
    expect(ids.slice(0, 8)).toEqual([
      'sq01',
      'sq02',
      'sq03',
      'sq04',
      'sq13',
      'sq14',
      'sq15',
      'sq16',
    ]);
    // EI 追问题 sq05 和 SN 追问题 sq07 优先
    expect(ids[8]).toBe('sq05');
    expect(ids[9]).toBe('sq07');
  });

  it('只有一个维度有答案时，其他维度都是弱信号', async () => {
    // 只答了 EI 维度的题目，其他维度无信号
    const ids = await service.generateOrderedQuestionIds('q1', {
      sq01: 'sq01_A', // EI: E=1, I=0
      sq13: 'sq13_A', // EI: E=2, I=0, delta=2, not weak
    });
    // SN、TF、JP 无信号，都是弱信号
    expect(ids).toHaveLength(12);
    expect(ids.slice(0, 8)).toEqual([
      'sq01',
      'sq02',
      'sq03',
      'sq04',
      'sq13',
      'sq14',
      'sq15',
      'sq16',
    ]);
    // 弱信号维度的追问题优先
    expect(ids[8]).toBe('sq07'); // SN 追问题
    expect(ids[9]).toBe('sq09'); // TF 追问题
    expect(ids[10]).toBe('sq11'); // JP 追问题
    // EI 是强信号，追问题最后
    expect(ids[11]).toBe('sq05');
  });

  it('筛选轮始终在前 8 位', async () => {
    const ids = await service.generateOrderedQuestionIds('q1', {
      sq01: 'sq01_A',
      sq13: 'sq13_B',
      sq02: 'sq02_A',
      sq14: 'sq14_B',
      sq03: 'sq03_A',
      sq15: 'sq15_B',
      sq04: 'sq04_A',
      sq16: 'sq16_B',
    });
    // 筛选轮始终在前 8 位
    expect(ids.slice(0, 8)).toEqual([
      'sq01',
      'sq02',
      'sq03',
      'sq04',
      'sq13',
      'sq14',
      'sq15',
      'sq16',
    ]);
  });

  it('始终返回不超过 TARGET_COUNT 题', async () => {
    const ids = await service.generateOrderedQuestionIds('q1');
    expect(ids.length).toBeLessThanOrEqual(12);
  });
});
