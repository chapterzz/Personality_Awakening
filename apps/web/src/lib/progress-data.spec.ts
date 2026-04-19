/**
 * `progress-data` 纯函数单测：答案推进与每 5 题保存触发条件。
 */
import { describe, expect, it } from 'vitest';

import {
  applyAvgAdvance,
  applyStandardAnswer,
  createInitialAvgProgress,
  createInitialStandardProgress,
  isStandardAssessmentComplete,
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

describe('createInitialAvgProgress', () => {
  it('构造符合 PRD §2.4 的 AVG 顶层与 avg 分支', () => {
    const d = createInitialAvgProgress('demo-avg-v1', 'intro', 'EI');
    expect(d.schema_version).toBe(1);
    expect(d.mode).toBe('AVG');
    expect(d.avg.script_id).toBe('demo-avg-v1');
    expect(d.avg.node_id).toBe('intro');
    expect(d.avg.chapter).toBe('EI');
    expect(d.avg.visited_node_ids).toEqual(['intro']);
    expect(d.avg.answers).toEqual({});
  });
});

describe('isStandardAssessmentComplete', () => {
  it('题序内全部有答案时为完成', () => {
    const ordered = ['q1', 'q2'];
    let d = createInitialStandardProgress(ordered, 'demo');
    d = applyStandardAnswer(d, 'q1', 'a');
    d = applyStandardAnswer(d, 'q2', 'b');
    expect(isStandardAssessmentComplete(d)).toBe(true);
  });

  it('缺少题序时不能判定完成', () => {
    const d = createInitialStandardProgress(['q1'], 'demo');
    const noOrder: typeof d = {
      ...d,
      standard: { ...d.standard, ordered_question_ids: undefined },
    };
    expect(isStandardAssessmentComplete(noOrder)).toBe(false);
  });

  it('未答完时非完成', () => {
    const d = createInitialStandardProgress(['q1', 'q2'], 'demo');
    expect(isStandardAssessmentComplete(d)).toBe(false);
  });
});

describe('applyAvgAdvance', () => {
  it('对话推进后更新 node_id 与 visited', () => {
    let d = createInitialAvgProgress('demo-avg-v1', 'intro', 'EI');
    d = applyAvgAdvance(d, 'energy_choice', { chapter: 'EI' });
    expect(d.avg.node_id).toBe('energy_choice');
    expect(d.avg.visited_node_ids).toEqual(['intro', 'energy_choice']);
  });

  it('选项分支写入 answers[node_id]', () => {
    let d = createInitialAvgProgress('demo-avg-v1', 'energy_choice', 'EI');
    d = applyAvgAdvance(d, 'path_e', {
      choice: { atNodeId: 'energy_choice', optionId: 'opt_out' },
      chapter: 'EI',
    });
    expect(d.avg.answers?.energy_choice).toBe('opt_out');
    expect(d.avg.node_id).toBe('path_e');
  });
});
