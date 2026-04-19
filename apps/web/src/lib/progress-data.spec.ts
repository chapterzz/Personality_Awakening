/**
 * `progress-data` 纯函数单测：答案推进与每 5 题保存触发条件。
 */
import { describe, expect, it } from 'vitest';

import {
  applyStandardAnswer,
  createInitialStandardProgress,
  shouldTriggerStandardAutosave,
} from './progress-data';

describe('createInitialStandardProgress', () => {
  it('构造符合 PRD §2.4 的 STANDARD 顶层与 standard 分支', () => {
    const d = createInitialStandardProgress(['a', 'b'], 'q-v1');
    expect(d.schema_version).toBe(1);
    expect(d.mode).toBe('STANDARD');
    expect(d.questionnaire_id).toBe('q-v1');
    expect(d.standard.current_index).toBe(0);
    expect(d.standard.ordered_question_ids).toEqual(['a', 'b']);
    expect(d.standard.answered_count).toBe(0);
  });
});

describe('applyStandardAnswer', () => {
  it('新题作答后推进 current_index', () => {
    let d = createInitialStandardProgress(['q1', 'q2'], 'demo');
    d = applyStandardAnswer(d, 'q1', 'opt_a');
    expect(d.standard.answers.q1).toBe('opt_a');
    expect(d.standard.current_index).toBe(1);
    expect(d.standard.answered_count).toBe(1);
  });

  it('同题改选不推进题号', () => {
    let d = createInitialStandardProgress(['q1', 'q2'], 'demo');
    d = applyStandardAnswer(d, 'q1', 'opt_a');
    d = applyStandardAnswer(d, 'q1', 'opt_b');
    expect(d.standard.current_index).toBe(1);
    expect(d.standard.answered_count).toBe(1);
  });
});

describe('shouldTriggerStandardAutosave', () => {
  it('第 5、10 题及最后一题触发', () => {
    expect(shouldTriggerStandardAutosave(5, 12)).toBe(true);
    expect(shouldTriggerStandardAutosave(10, 12)).toBe(true);
    expect(shouldTriggerStandardAutosave(12, 12)).toBe(true);
    expect(shouldTriggerStandardAutosave(4, 12)).toBe(false);
    expect(shouldTriggerStandardAutosave(0, 12)).toBe(false);
  });
});
