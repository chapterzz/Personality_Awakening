/**
 * 精灵文案 CMS 共享校验（T4.7）：犹豫提示与四维互斥文案。
 */
import { VALID_DIMENSIONS } from '../questionnaire/questionnaire-validation';

/** 校验失败时抛出，携带 machine-readable code */
export class SpritePromptValidationError extends Error {
  readonly name = 'SpritePromptValidationError';

  constructor(readonly code: string) {
    super(code);
  }
}

export type SpritePromptPayload = {
  hesitationLines: string[];
  mutexLines: Record<string, string[]>;
};

const MIN_LINE_LEN = 1;
const MAX_LINE_LEN = 200;

function validateLineArray(lines: unknown, field: string): string[] {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new SpritePromptValidationError(`empty_${field}`);
  }
  return lines.map((line, index) => {
    if (typeof line !== 'string') {
      throw new SpritePromptValidationError(`invalid_${field}_type:${index}`);
    }
    const trimmed = line.trim();
    if (trimmed.length < MIN_LINE_LEN || trimmed.length > MAX_LINE_LEN) {
      throw new SpritePromptValidationError(`invalid_${field}_length:${index}`);
    }
    return trimmed;
  });
}

/**
 * 校验精灵文案 payload；通过则返回 trim 后的规范化对象。
 */
export function validateSpritePromptPayload(input: SpritePromptPayload): SpritePromptPayload {
  const hesitationLines = validateLineArray(input.hesitationLines, 'hesitationLines');

  if (
    typeof input.mutexLines !== 'object' ||
    input.mutexLines === null ||
    Array.isArray(input.mutexLines)
  ) {
    throw new SpritePromptValidationError('invalid_mutexLines');
  }

  const mutexLines: Record<string, string[]> = {};
  for (const dim of VALID_DIMENSIONS) {
    const raw = input.mutexLines[dim];
    mutexLines[dim] = validateLineArray(raw, `mutexLines_${dim}`);
  }

  for (const key of Object.keys(input.mutexLines)) {
    if (!VALID_DIMENSIONS.includes(key as (typeof VALID_DIMENSIONS)[number])) {
      throw new SpritePromptValidationError(`invalid_mutex_dimension:${key}`);
    }
  }

  return { hesitationLines, mutexLines };
}
