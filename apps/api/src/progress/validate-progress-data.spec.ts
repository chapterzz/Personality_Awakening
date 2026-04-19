/**
 * `assertValidProgressData` 单元测试（合法/非法样例）。
 */
import { assertValidProgressData, ProgressDataValidationError } from './validate-progress-data';

const standardMinimal = {
  schema_version: 1,
  mode: 'STANDARD',
  standard: {
    current_index: 0,
    answers: {},
  },
} as const;

describe('assertValidProgressData (PRD §2.4)', () => {
  it('accepts minimal STANDARD payload', () => {
    expect(assertValidProgressData({ ...standardMinimal })).toEqual(standardMinimal);
  });

  it('accepts STANDARD with optional fields', () => {
    const data = {
      schema_version: 1,
      mode: 'STANDARD',
      questionnaire_id: 'q1',
      standard: {
        current_index: 2,
        answers: { Q1: 'A', Q2: 1 },
        ordered_question_ids: ['Q1', 'Q2'],
        answered_count: 2,
      },
      meta: { started_at: '2026-04-18T10:00:00.000Z', last_client: 'web' },
    };
    expect(assertValidProgressData(data)).toEqual(data);
  });

  it('accepts minimal AVG payload', () => {
    const data = {
      schema_version: 1,
      mode: 'AVG',
      avg: {
        script_id: 's1',
        node_id: 'n1',
      },
    };
    expect(assertValidProgressData(data)).toEqual(data);
  });

  it('rejects wrong schema_version', () => {
    expect(() =>
      assertValidProgressData({
        ...standardMinimal,
        schema_version: 2,
      }),
    ).toThrow(ProgressDataValidationError);
  });

  it('rejects STANDARD without standard branch', () => {
    expect(() =>
      assertValidProgressData({
        schema_version: 1,
        mode: 'STANDARD',
      }),
    ).toThrow(ProgressDataValidationError);
  });

  it('rejects avg branch when mode is STANDARD', () => {
    expect(() =>
      assertValidProgressData({
        schema_version: 1,
        mode: 'STANDARD',
        standard: { current_index: 0, answers: {} },
        avg: { script_id: 'x', node_id: 'y' },
      }),
    ).toThrow(ProgressDataValidationError);
  });

  it('rejects answered_count inconsistent with answers', () => {
    expect(() =>
      assertValidProgressData({
        schema_version: 1,
        mode: 'STANDARD',
        standard: {
          current_index: 0,
          answers: { Q1: 'a' },
          answered_count: 2,
        },
      }),
    ).toThrow(ProgressDataValidationError);
  });
});
