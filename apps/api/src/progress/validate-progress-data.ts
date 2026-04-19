/**
 * PRD §2.4 `progress_data` JSON 结构校验（schema_version = 1，snake_case）。
 */

export class ProgressDataValidationError extends Error {
  readonly name = 'ProgressDataValidationError';
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function assertStringRecord(
  value: unknown,
  field: string,
): asserts value is Record<string, string | number> {
  if (!isPlainObject(value)) {
    throw new ProgressDataValidationError(`${field} must be an object`);
  }
  for (const [k, v] of Object.entries(value)) {
    if (typeof k !== 'string') {
      throw new ProgressDataValidationError(`${field} keys must be strings`);
    }
    if (typeof v !== 'string' && typeof v !== 'number') {
      throw new ProgressDataValidationError(`${field} values must be string or number`);
    }
  }
}

function assertStandardBranch(standard: unknown): void {
  if (!isPlainObject(standard)) {
    throw new ProgressDataValidationError('standard must be an object');
  }
  if (typeof standard.current_index !== 'number' || !Number.isInteger(standard.current_index)) {
    throw new ProgressDataValidationError('standard.current_index must be an integer');
  }
  if (standard.current_index < 0) {
    throw new ProgressDataValidationError('standard.current_index must be >= 0');
  }
  assertStringRecord(standard.answers, 'standard.answers');
  if (standard.ordered_question_ids !== undefined) {
    if (!Array.isArray(standard.ordered_question_ids)) {
      throw new ProgressDataValidationError('standard.ordered_question_ids must be an array');
    }
    for (const id of standard.ordered_question_ids) {
      if (typeof id !== 'string') {
        throw new ProgressDataValidationError('standard.ordered_question_ids must be string[]');
      }
    }
  }
  if (standard.answered_count !== undefined) {
    if (typeof standard.answered_count !== 'number' || !Number.isInteger(standard.answered_count)) {
      throw new ProgressDataValidationError('standard.answered_count must be an integer');
    }
    if (standard.answered_count < 0) {
      throw new ProgressDataValidationError('standard.answered_count must be >= 0');
    }
    const n = Object.keys(standard.answers as object).length;
    if (standard.answered_count !== n) {
      throw new ProgressDataValidationError('standard.answered_count must match answers key count');
    }
  }
}

const AVG_CHAPTERS = new Set(['EI', 'SN', 'TF', 'JP']);

function assertAvgBranch(avg: unknown): void {
  if (!isPlainObject(avg)) {
    throw new ProgressDataValidationError('avg must be an object');
  }
  if (typeof avg.script_id !== 'string' || avg.script_id.length === 0) {
    throw new ProgressDataValidationError('avg.script_id must be a non-empty string');
  }
  if (typeof avg.node_id !== 'string' || avg.node_id.length === 0) {
    throw new ProgressDataValidationError('avg.node_id must be a non-empty string');
  }
  if (avg.chapter !== undefined) {
    if (typeof avg.chapter !== 'string' || !AVG_CHAPTERS.has(avg.chapter)) {
      throw new ProgressDataValidationError(
        'avg.chapter must be one of EI | SN | TF | JP when present',
      );
    }
  }
  if (avg.answers !== undefined) {
    assertStringRecord(avg.answers, 'avg.answers');
  }
  if (avg.visited_node_ids !== undefined) {
    if (!Array.isArray(avg.visited_node_ids)) {
      throw new ProgressDataValidationError('avg.visited_node_ids must be an array');
    }
    for (const id of avg.visited_node_ids) {
      if (typeof id !== 'string') {
        throw new ProgressDataValidationError('avg.visited_node_ids must be string[]');
      }
    }
  }
}

function assertMeta(meta: unknown): void {
  if (!isPlainObject(meta)) {
    throw new ProgressDataValidationError('meta must be an object');
  }
  if (meta.started_at !== undefined) {
    if (typeof meta.started_at !== 'string') {
      throw new ProgressDataValidationError('meta.started_at must be an ISO 8601 string');
    }
    if (Number.isNaN(Date.parse(meta.started_at))) {
      throw new ProgressDataValidationError('meta.started_at must be a valid date string');
    }
  }
  if (meta.last_client !== undefined && typeof meta.last_client !== 'string') {
    throw new ProgressDataValidationError('meta.last_client must be a string');
  }
}

/** 校验通过后，`input` 可作为 JSON 写入 `TemporarySession.progress_data`。 */
export function assertValidProgressData(input: unknown): Record<string, unknown> {
  if (!isPlainObject(input)) {
    throw new ProgressDataValidationError('progress_data must be a plain object');
  }
  if (input.schema_version !== 1) {
    throw new ProgressDataValidationError('schema_version must be 1');
  }
  if (input.mode !== 'STANDARD' && input.mode !== 'AVG') {
    throw new ProgressDataValidationError('mode must be STANDARD or AVG');
  }
  if (input.questionnaire_id !== undefined && typeof input.questionnaire_id !== 'string') {
    throw new ProgressDataValidationError('questionnaire_id must be a string when present');
  }

  if (input.mode === 'STANDARD') {
    assertStandardBranch(input.standard);
  } else if (input.standard !== undefined) {
    throw new ProgressDataValidationError('standard must be omitted when mode is AVG');
  }

  if (input.mode === 'AVG') {
    assertAvgBranch(input.avg);
  } else if (input.avg !== undefined) {
    throw new ProgressDataValidationError('avg must be omitted when mode is STANDARD');
  }

  if (input.meta !== undefined) {
    assertMeta(input.meta);
  }

  return input;
}
