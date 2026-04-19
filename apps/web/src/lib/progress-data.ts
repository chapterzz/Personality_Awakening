/**
 * PRD §2.4 `progress_data` 前端类型与构造（schema_version = 1，snake_case，与后端校验一致）。
 */

export type ProgressMode = 'STANDARD' | 'AVG';

export type StandardProgressBranch = {
  current_index: number;
  answers: Record<string, string | number>;
  ordered_question_ids?: string[];
  answered_count?: number;
};

export type ProgressMeta = {
  started_at?: string;
  last_client?: string;
};

/** 标准模式进行中快照（顶层须含 schema_version / mode / standard） */
export type StandardProgressDataV1 = {
  schema_version: 1;
  mode: 'STANDARD';
  questionnaire_id?: string;
  standard: StandardProgressBranch;
  meta?: ProgressMeta;
};

/** PRD §2.4 `avg` 分支（进行中快照） */
export type AvgProgressBranch = {
  script_id: string;
  node_id: string;
  chapter?: 'EI' | 'SN' | 'TF' | 'JP';
  answers?: Record<string, string | number>;
  visited_node_ids?: string[];
};

/** AVG 模式进行中快照（顶层须含 schema_version / mode / avg） */
export type AvgProgressDataV1 = {
  schema_version: 1;
  mode: 'AVG';
  /** 可与 `avg.script_id` 一致，便于与问卷 id 字段对账 */
  questionnaire_id?: string;
  avg: AvgProgressBranch;
  meta?: ProgressMeta;
};

export type ProgressDataV1 = StandardProgressDataV1 | AvgProgressDataV1;

/** 新建 AVG 进度：从入口节点开始，并记录已访问首节点（续答依赖服务端快照）。 */
export function createInitialAvgProgress(
  scriptId: string,
  startNodeId: string,
  chapter?: AvgProgressBranch['chapter'],
): AvgProgressDataV1 {
  return {
    schema_version: 1,
    mode: 'AVG',
    questionnaire_id: scriptId,
    avg: {
      script_id: scriptId,
      node_id: startNodeId,
      ...(chapter !== undefined ? { chapter } : {}),
      answers: {},
      visited_node_ids: [startNodeId],
    },
    meta: {
      started_at: new Date().toISOString(),
      last_client: 'web',
    },
  };
}

/**
 * 推进到下一节点；选项节点须在 `choice` 中记录 `atNodeId` 与 `optionId` 以写入 `avg.answers`。
 * `chapter` 由当前节点配置传入，与 PRD 四章标签对齐。
 */
export function applyAvgAdvance(
  data: AvgProgressDataV1,
  nextNodeId: string,
  opts?: {
    choice?: { atNodeId: string; optionId: string | number };
    chapter?: AvgProgressBranch['chapter'];
  },
): AvgProgressDataV1 {
  const prevAnswers = data.avg.answers ?? {};
  const answers =
    opts?.choice !== undefined
      ? { ...prevAnswers, [opts.choice.atNodeId]: opts.choice.optionId }
      : { ...prevAnswers };
  const visited = [...(data.avg.visited_node_ids ?? [])];
  if (!visited.includes(nextNodeId)) {
    visited.push(nextNodeId);
  }
  return {
    ...data,
    avg: {
      ...data.avg,
      node_id: nextNodeId,
      answers,
      visited_node_ids: visited,
      ...(opts?.chapter !== undefined ? { chapter: opts.chapter } : {}),
    },
  };
}

export function createInitialStandardProgress(
  orderedQuestionIds: string[],
  questionnaireId: string,
): StandardProgressDataV1 {
  return {
    schema_version: 1,
    mode: 'STANDARD',
    questionnaire_id: questionnaireId,
    standard: {
      current_index: 0,
      answers: {},
      ordered_question_ids: orderedQuestionIds,
      answered_count: 0,
    },
    meta: {
      started_at: new Date().toISOString(),
      last_client: 'web',
    },
  };
}

/**
 * 写入答案并推进题号（同一题改选不推进）；`answered_count` 与 `answers` 键数量一致（后端校验）。
 */
export function applyStandardAnswer(
  data: StandardProgressDataV1,
  questionId: string,
  optionId: string | number,
): StandardProgressDataV1 {
  const prev = data.standard.answers[questionId];
  const answers = { ...data.standard.answers, [questionId]: optionId };
  const answeredCount = Object.keys(answers).length;
  const ordered = data.standard.ordered_question_ids ?? [];
  const wasNew = prev === undefined;
  const nextIndex = wasNew
    ? Math.min(data.standard.current_index + 1, ordered.length)
    : data.standard.current_index;
  return {
    ...data,
    standard: {
      ...data.standard,
      answers,
      answered_count: answeredCount,
      current_index: nextIndex,
    },
  };
}

/**
 * 标准模式是否已答完当前题序（演示页「本卷已完成」与完成后进入 AVG 共用判定）。
 * 以 `ordered_question_ids` 与 `answers` 为准；无题序时无法判定为完成。
 */
export function isStandardAssessmentComplete(data: StandardProgressDataV1): boolean {
  const ordered = data.standard.ordered_question_ids;
  if (!ordered || ordered.length === 0) {
    return false;
  }
  const answers = data.standard.answers;
  for (const qid of ordered) {
    if (answers[qid] === undefined) {
      return false;
    }
  }
  return true;
}

/**
 * 是否触发「每 5 题」自动保存；最后一题答完时也须保存（PRD：至少每 5 题 + 完成态）。
 */
export function shouldTriggerStandardAutosave(
  answeredCount: number,
  totalQuestions: number,
): boolean {
  if (answeredCount <= 0) return false;
  if (answeredCount === totalQuestions) return true;
  return answeredCount % 5 === 0;
}
