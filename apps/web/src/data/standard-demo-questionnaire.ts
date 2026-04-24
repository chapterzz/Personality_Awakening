/**
 * 标准模式演示题库（静态，后续由 CMS/T2.7 替换）；`question_id` / `option_id` 与 `progress_data.standard` 对齐。
 */

export type DemoDimensionTag = 'EI' | 'SN' | 'TF' | 'JP';

export type DemoOptionSide = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

/**
 * 标准模式选项的“维度信号”，用于 T2.3 互斥检测（并非最终 MBTI 计分实现）。
 * - `dimension`: 属于哪一对维度（EI/SN/TF/JP）
 * - `side`: 该选项偏向哪一侧
 * - `weight`: 强度（互斥检测只关心是否“强烈”）
 */
export type DemoOption = {
  id: string;
  label: string;
  dimension: DemoDimensionTag;
  side: DemoOptionSide;
  weight: 1 | 2 | 3;
};

export type DemoQuestion = {
  id: string;
  text: string;
  options: DemoOption[];
};

const mk = (
  id: string,
  dimension: DemoDimensionTag,
  text: string,
  a: { label: string; side: DemoOptionSide; weight?: 1 | 2 | 3 },
  b: { label: string; side: DemoOptionSide; weight?: 1 | 2 | 3 },
): DemoQuestion => ({
  id,
  text,
  options: [
    { id: `${id}_A`, label: a.label, dimension, side: a.side, weight: a.weight ?? 2 },
    { id: `${id}_B`, label: b.label, dimension, side: b.side, weight: b.weight ?? 2 },
  ],
});

/** 与 PRD §2.4 中 `questionnaire_id` 对应的演示版本标识 */
export const DEMO_QUESTIONNAIRE_ID = 'demo-standard-v1';

/** 固定题序（续答时原样回传 `ordered_question_ids`） */
export const DEMO_ORDERED_QUESTION_IDS = [
  'q01',
  'q02',
  'q03',
  'q04',
  'q05',
  'q06',
  'q07',
  'q08',
  'q09',
  'q10',
  'q11',
  'q12',
] as const;

export const DEMO_QUESTIONS: Record<string, DemoQuestion> = {
  q01: mk(
    'q01',
    'EI',
    '周末放松时，你更愿意？',
    { label: '和朋友外出或聊天', side: 'E', weight: 2 },
    { label: '独自看书、听音乐或发呆', side: 'I', weight: 2 },
  ),
  q02: mk(
    'q02',
    'JP',
    '面对新任务时，你通常？',
    { label: '先动手试，边做边调整', side: 'P', weight: 2 },
    { label: '先想清楚步骤再开始', side: 'J', weight: 2 },
  ),
  q03: mk(
    'q03',
    'TF',
    '做决定时，你更依赖？',
    { label: '事实、经验与可验证的信息', side: 'T', weight: 2 },
    { label: '感受、价值与对人的影响', side: 'F', weight: 2 },
  ),
  q04: mk(
    'q04',
    'JP',
    '临近截止日期时，你更倾向？',
    { label: '提前规划并留出缓冲', side: 'J', weight: 2 },
    { label: '在压力下效率更高', side: 'P', weight: 2 },
  ),
  q05: mk(
    'q05',
    'EI',
    '在人群中，你通常？',
    { label: '容易开始对话、表达想法', side: 'E', weight: 2 },
    { label: '先观察，再选择性发言', side: 'I', weight: 2 },
  ),
  q06: mk(
    'q06',
    'SN',
    '学习新东西时，你更喜欢？',
    { label: '具体例子与步骤演示', side: 'S', weight: 2 },
    { label: '整体概念与可能性', side: 'N', weight: 2 },
  ),
  q07: mk(
    'q07',
    'TF',
    '同学向你求助冲突时，你更先考虑？',
    { label: '公平与规则', side: 'T', weight: 2 },
    { label: '和谐与感受', side: 'F', weight: 2 },
  ),
  q08: mk(
    'q08',
    'JP',
    '旅行/活动计划，你更享受？',
    { label: '清单与时间表明确', side: 'J', weight: 2 },
    { label: '留空白让灵感发生', side: 'P', weight: 2 },
  ),
  q09: mk(
    'q09',
    'EI',
    '长时间独处后，你一般会？',
    { label: '想找人聊聊补充能量', side: 'E', weight: 2 },
    { label: '觉得恢复精力即可', side: 'I', weight: 2 },
  ),
  q10: mk(
    'q10',
    'SN',
    '描述未来时，你更常用？',
    { label: '具体可落地的画面', side: 'S', weight: 2 },
    { label: '比喻、联想与多种可能', side: 'N', weight: 2 },
  ),
  q11: mk(
    'q11',
    'TF',
    '被批评时，你更在意？',
    { label: '逻辑是否站得住', side: 'T', weight: 2 },
    { label: '对方语气是否让你难堪', side: 'F', weight: 2 },
  ),
  q12: mk(
    'q12',
    'JP',
    '作业/项目收尾时，你更想？',
    { label: '尽早收尾并检查细节', side: 'J', weight: 2 },
    { label: '再润色一下灵感部分', side: 'P', weight: 2 },
  ),
};

export type DemoStandardConfig = {
  questionnaireId: string;
  orderedQuestionIds: readonly string[];
  questions: Record<string, DemoQuestion>;
};

export const DEMO_STANDARD_CONFIG: DemoStandardConfig = {
  questionnaireId: DEMO_QUESTIONNAIRE_ID,
  orderedQuestionIds: DEMO_ORDERED_QUESTION_IDS,
  questions: DEMO_QUESTIONS,
};
