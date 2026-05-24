/**
 * 题库 CMS 共享校验器单元测试（T4.6 / 随机 48 题发布规则）。
 */
import { PER_DIMENSION_COUNT } from './random-sequence.util';
import {
  QuestionnaireValidationError,
  validateOptionScoring,
  validateQuestionGroupFields,
  validateQuestionnaireForPublish,
} from './questionnaire-validation';

function mkQuestion(dim: string, groupTag: string | null = null) {
  return {
    dimension: dim,
    groupTag,
    options: [
      { dimension: dim, side: dim[0], weight: 2 },
      { dimension: dim, side: dim[1], weight: 2 },
    ],
  };
}

function mkPublishReadyBank() {
  const questions = [];
  for (const dim of ['EI', 'SN', 'TF', 'JP'] as const) {
    for (let i = 0; i < PER_DIMENSION_COUNT; i++) {
      questions.push(mkQuestion(dim));
    }
  }
  return questions;
}

describe('validateOptionScoring', () => {
  it('rejects invalid side for dimension EI', () => {
    expect(() => validateOptionScoring({ dimension: 'EI', side: 'X', weight: 2 })).toThrow(
      QuestionnaireValidationError,
    );
  });

  it('accepts valid EI scoring triple', () => {
    expect(() => validateOptionScoring({ dimension: 'EI', side: 'E', weight: 2 })).not.toThrow();
  });

  it('skips validation when dimension is null', () => {
    expect(() =>
      validateOptionScoring({ dimension: null, side: null, weight: null }),
    ).not.toThrow();
  });

  it('rejects invalid weight', () => {
    expect(() => validateOptionScoring({ dimension: 'SN', side: 'S', weight: 0 })).toThrow(
      QuestionnaireValidationError,
    );
  });
});

describe('validateQuestionGroupFields', () => {
  it('rejects unknown groupTag', () => {
    expect(() => validateQuestionGroupFields({ dimension: 'EI', groupTag: 'invalid' })).toThrow(
      QuestionnaireValidationError,
    );
  });

  it('accepts null groupTag with dimension', () => {
    expect(() => validateQuestionGroupFields({ dimension: 'EI', groupTag: null })).not.toThrow();
  });
});

describe('validateQuestionnaireForPublish', () => {
  it('rejects when dimension pool insufficient', () => {
    expect(() => validateQuestionnaireForPublish([mkQuestion('EI')])).toThrow(
      QuestionnaireValidationError,
    );
  });

  it('rejects question without dimension', () => {
    expect(() =>
      validateQuestionnaireForPublish([
        {
          dimension: null,
          groupTag: null,
          options: [
            { dimension: 'EI', side: 'E', weight: 1 },
            { dimension: 'EI', side: 'I', weight: 1 },
          ],
        },
      ]),
    ).toThrow(QuestionnaireValidationError);
  });

  it('rejects question with fewer than 2 options', () => {
    expect(() =>
      validateQuestionnaireForPublish([
        {
          dimension: 'EI',
          groupTag: null,
          options: [{ dimension: 'EI', side: 'E', weight: 1 }],
        },
      ]),
    ).toThrow(QuestionnaireValidationError);
  });

  it('accepts valid publish-ready questionnaire without screening', () => {
    expect(() => validateQuestionnaireForPublish(mkPublishReadyBank())).not.toThrow();
  });
});
