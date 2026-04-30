/**
 * 结果页评分数据：从 STANDARD/AVG 进度提取 MBTI 信号并调用后端 `/scoring/mbti`。
 */
import type { AvgScriptConfig } from '@/data/avg-demo-script';
import type { QuestionnaireConfig } from '@/data/questionnaire-types';
import { getBrowserApiBaseUrl } from '@/lib/api-base';
import type { AvgProgressDataV1, StandardProgressDataV1 } from '@/lib/progress-data';

export type MbtiMode = 'STANDARD' | 'AVG';
export type MbtiDimension = 'EI' | 'SN' | 'TF' | 'JP';
export type MbtiSide = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

export type MbtiSignal = {
  dimension: MbtiDimension;
  side: MbtiSide;
  weight: 1 | 2 | 3;
};

export type MbtiScores = {
  EI: { E: number; I: number; winner: 'E' | 'I'; delta: number };
  SN: { S: number; N: number; winner: 'S' | 'N'; delta: number };
  TF: { T: number; F: number; winner: 'T' | 'F'; delta: number };
  JP: { J: number; P: number; winner: 'J' | 'P'; delta: number };
};

export type MbtiReportResult = {
  mode: MbtiMode;
  scores: MbtiScores;
  mbti_type: string;
};

export class ReportScoringError extends Error {
  readonly name = 'ReportScoringError';
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: unknown,
  ) {
    super(message);
  }
}

/**
 * 将标准模式已选答案映射为 MBTI 信号；仅提取可在题库配置中匹配到的选项。
 */
export function buildStandardSignals(
  progress: StandardProgressDataV1,
  config: QuestionnaireConfig,
): MbtiSignal[] {
  const answers = progress.standard.answers;
  const ordered = progress.standard.ordered_question_ids ?? [...config.orderedQuestionIds];
  const signals: MbtiSignal[] = [];

  for (const questionId of ordered) {
    const answerId = answers[questionId];
    if (answerId === undefined) continue;
    const question = config.questions[questionId];
    if (!question) continue;
    const option = question.options.find((item) => item.id === String(answerId));
    if (!option) continue;
    signals.push({
      dimension: option.dimension,
      side: option.side,
      weight: option.weight,
    });
  }
  return signals;
}

/**
 * 将 AVG 已选分支映射为 MBTI 信号；只统计定义了维度/方向/权重的选项。
 */
export function buildAvgSignals(
  progress: AvgProgressDataV1,
  script: AvgScriptConfig,
): MbtiSignal[] {
  const answers = progress.avg.answers ?? {};
  const signals: MbtiSignal[] = [];
  for (const [nodeId, optionId] of Object.entries(answers)) {
    const node = script.nodes[nodeId];
    if (!node || node.kind !== 'choice') continue;
    const option = node.options.find((item) => item.id === String(optionId));
    if (!option || !option.dimension || !option.side || !option.weight) continue;
    signals.push({
      dimension: option.dimension,
      side: option.side,
      weight: option.weight,
    });
  }
  return signals;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function parseReportResult(raw: unknown): MbtiReportResult {
  if (!isRecord(raw)) {
    throw new ReportScoringError('invalid_report_payload');
  }
  const mode = raw.mode;
  const mbtiType = raw.mbti_type;
  const scores = raw.scores;
  if (
    (mode !== 'STANDARD' && mode !== 'AVG') ||
    typeof mbtiType !== 'string' ||
    !isRecord(scores)
  ) {
    throw new ReportScoringError('invalid_report_payload');
  }
  return raw as MbtiReportResult;
}

/**
 * 调用后端 MBTI 计分接口，返回结果页所需的类型与四维分值。
 */
export async function fetchMbtiReport(input: {
  mode: MbtiMode;
  signals: MbtiSignal[];
}): Promise<MbtiReportResult> {
  if (input.signals.length === 0) {
    throw new ReportScoringError('signals_required');
  }
  const base = getBrowserApiBaseUrl();
  const response = await fetch(`${base.replace(/\/$/, '')}/scoring/mbti`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: input.mode,
      signals: input.signals,
    }),
    credentials: 'omit',
  });

  const text = await response.text();
  const body = text ? (JSON.parse(text) as unknown) : null;
  if (!response.ok) {
    throw new ReportScoringError('scoring_http_error', response.status, body);
  }
  if (!isRecord(body) || body.success !== true) {
    throw new ReportScoringError('scoring_response_invalid', response.status, body);
  }
  return parseReportResult(body.data);
}
