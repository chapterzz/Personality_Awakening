/**
 * 精灵文案校验器单元测试（T4.7）。
 */
import {
  SpritePromptValidationError,
  validateSpritePromptPayload,
} from './sprite-prompt-validation';

const validPayload = {
  hesitationLines: ['你在犹豫吗？'],
  mutexLines: {
    EI: ['E 和 I 都很有你！'],
    SN: ['S 与 N 都被你点亮了'],
    TF: ['T 与 F 都很强'],
    JP: ['J 与 P 都有你'],
  },
};

describe('validateSpritePromptPayload', () => {
  it('rejects empty hesitationLines', () => {
    expect(() =>
      validateSpritePromptPayload({ hesitationLines: [], mutexLines: { EI: ['x'] } }),
    ).toThrow(/hesitationLines/);
  });

  it('accepts valid payload', () => {
    expect(() => validateSpritePromptPayload(validPayload)).not.toThrow();
  });

  it('rejects missing mutex dimension', () => {
    expect(() =>
      validateSpritePromptPayload({
        hesitationLines: ['ok'],
        mutexLines: { EI: ['x'], SN: ['x'], TF: ['x'] },
      }),
    ).toThrow(/mutexLines_JP/);
  });

  it('rejects empty mutex line for dimension', () => {
    expect(() =>
      validateSpritePromptPayload({
        hesitationLines: ['ok'],
        mutexLines: { EI: [], SN: ['x'], TF: ['x'], JP: ['x'] },
      }),
    ).toThrow(SpritePromptValidationError);
  });

  it('trims hesitation lines', () => {
    const result = validateSpritePromptPayload({
      ...validPayload,
      hesitationLines: ['  trimmed  '],
    });
    expect(result.hesitationLines[0]).toBe('trimmed');
  });
});
