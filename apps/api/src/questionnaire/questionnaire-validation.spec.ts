/**
 * 题库 CMS 共享校验器单元测试（T4.6）。
 */
import {
  QuestionnaireValidationError,
  validateOptionScoring,
  validateQuestionGroupFields,
  validateQuestionnaireForPublish,
} from './questionnaire-validation';

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

  it('accepts screening with dimension', () => {
    expect(() =>
      validateQuestionGroupFields({ dimension: 'EI', groupTag: 'screening' }),
    ).not.toThrow();
  });
});

describe('validateQuestionnaireForPublish', () => {
  it('rejects when no screening question', () => {
    expect(() =>
      validateQuestionnaireForPublish([
        {
          groupTag: 'ei_followup',
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
          groupTag: 'screening',
          options: [{ dimension: 'EI', side: 'E', weight: 1 }],
        },
      ]),
    ).toThrow(QuestionnaireValidationError);
  });

  it('accepts valid publish-ready questionnaire', () => {
    expect(() =>
      validateQuestionnaireForPublish([
        {
          groupTag: 'screening',
          options: [
            { dimension: 'EI', side: 'E', weight: 1 },
            { dimension: 'EI', side: 'I', weight: 1 },
          ],
        },
      ]),
    ).not.toThrow();
  });
});
