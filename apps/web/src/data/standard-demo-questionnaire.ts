/**
 * 标准模式演示题库（静态，后续由 CMS/T2.7 替换）；`question_id` / `option_id` 与 `progress_data.standard` 对齐。
 */

export type DemoOption = { id: string; label: string };

export type DemoQuestion = {
  id: string;
  text: string;
  options: DemoOption[];
};

const mk = (id: string, text: string, a: string, b: string): DemoQuestion => ({
  id,
  text,
  options: [
    { id: `${id}_A`, label: a },
    { id: `${id}_B`, label: b },
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
  q01: mk('q01', '周末放松时，你更愿意？', '和朋友外出或聊天', '独自看书、听音乐或发呆'),
  q02: mk('q02', '面对新任务时，你通常？', '先动手试，边做边调整', '先想清楚步骤再开始'),
  q03: mk('q03', '做决定时，你更依赖？', '事实、经验与可验证的信息', '感受、价值与对人的影响'),
  q04: mk('q04', '临近截止日期时，你更倾向？', '提前规划并留出缓冲', '在压力下效率更高'),
  q05: mk('q05', '在人群中，你通常？', '容易开始对话、表达想法', '先观察，再选择性发言'),
  q06: mk('q06', '学习新东西时，你更喜欢？', '具体例子与步骤演示', '整体概念与可能性'),
  q07: mk('q07', '同学向你求助冲突时，你更先考虑？', '公平与规则', '和谐与感受'),
  q08: mk('q08', '旅行/活动计划，你更享受？', '清单与时间表明确', '留空白让灵感发生'),
  q09: mk('q09', '长时间独处后，你一般会？', '想找人聊聊补充能量', '觉得恢复精力即可'),
  q10: mk('q10', '描述未来时，你更常用？', '具体可落地的画面', '比喻、联想与多种可能'),
  q11: mk('q11', '被批评时，你更在意？', '逻辑是否站得住', '对方语气是否让你难堪'),
  q12: mk('q12', '作业/项目收尾时，你更想？', '尽早收尾并检查细节', '再润色一下灵感部分'),
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
