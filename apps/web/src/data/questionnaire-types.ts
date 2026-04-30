/**
 * 共享题库类型定义（T2.7）：让 demo 静态数据和服务端 API 响应都符合同一接口。
 * 供 useStandardTest、buildStandardScores 等消费。
 */

/** 维度标签 */
export type QuestionnaireDimension = 'EI' | 'SN' | 'TF' | 'JP';

/** 维度偏向侧 */
export type QuestionnaireSide = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

/** 选项：包含维度信号元数据，用于计分和自适应选题 */
export type QuestionnaireOption = {
  id: string;
  label: string;
  dimension: QuestionnaireDimension;
  side: QuestionnaireSide;
  weight: 1 | 2 | 3;
};

/** 题目：包含选项列表 */
export type QuestionnaireQuestion = {
  id: string;
  text: string;
  options: QuestionnaireOption[];
};

/**
 * 问卷配置：hook 和 scoring 函数的统一输入。
 * 无论是 demo 静态数据还是服务端自适应数据，都转换为此格式。
 */
export type QuestionnaireConfig = {
  questionnaireId: string;
  orderedQuestionIds: string[];
  questions: Record<string, QuestionnaireQuestion>;
};
