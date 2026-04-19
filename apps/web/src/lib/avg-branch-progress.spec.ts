/**
 * AVG「分支进度」纯函数单测：对白继续不增步数、选分支后才增（防漏测回归）。
 */
import { describe, expect, it } from 'vitest';

import type { AvgScriptConfig } from '@/data/avg-demo-script';
import { DEMO_AVG_SCRIPT } from '@/data/avg-demo-script';
import { applyAvgAdvance, createInitialAvgProgress } from '@/lib/progress-data';

import { getAvgBranchProgressStepIndex, getAvgBranchProgressTotalSteps } from './avg-script';

describe('getAvgBranchProgressTotalSteps', () => {
  it('演示脚本仅 1 处选项，分母为 1', () => {
    expect(getAvgBranchProgressTotalSteps(DEMO_AVG_SCRIPT)).toBe(1);
  });

  it('无选项节点时回退为节点数（至少为 1）', () => {
    const noChoice: AvgScriptConfig = {
      script_id: 'no-choice',
      start_node_id: 'a',
      backgrounds: { x: 'from-black to-black' },
      nodes: {
        a: {
          kind: 'dialogue',
          background_key: 'x',
          lines: [{ speaker: 'narrator', text: 't' }],
          next_id: 'b',
        },
        b: { kind: 'end', background_key: 'x', lines: [{ speaker: 'narrator', text: 'end' }] },
      },
    };
    expect(getAvgBranchProgressTotalSteps(noChoice)).toBe(2);
  });
});

describe('getAvgBranchProgressStepIndex', () => {
  it('开场仅对白：已访问首节点但 answers 为空 → 0/1 的分子为 0', () => {
    const d = createInitialAvgProgress(
      DEMO_AVG_SCRIPT.script_id,
      DEMO_AVG_SCRIPT.start_node_id,
      'EI',
    );
    expect(d.avg.visited_node_ids?.length).toBeGreaterThanOrEqual(1);
    expect(getAvgBranchProgressStepIndex(DEMO_AVG_SCRIPT, d.avg)).toBe(0);
  });

  it('对白「继续」到选项节点：仍无 answers → 分子仍为 0', () => {
    let d = createInitialAvgProgress(
      DEMO_AVG_SCRIPT.script_id,
      DEMO_AVG_SCRIPT.start_node_id,
      'EI',
    );
    d = applyAvgAdvance(d, 'energy_choice', { chapter: 'EI' });
    expect(d.avg.node_id).toBe('energy_choice');
    expect(Object.keys(d.avg.answers ?? {}).length).toBe(0);
    expect(getAvgBranchProgressStepIndex(DEMO_AVG_SCRIPT, d.avg)).toBe(0);
  });

  it('选择分支后：answers 有一条 → 分子为 1', () => {
    let d = createInitialAvgProgress(
      DEMO_AVG_SCRIPT.script_id,
      DEMO_AVG_SCRIPT.start_node_id,
      'EI',
    );
    d = applyAvgAdvance(d, 'energy_choice', { chapter: 'EI' });
    d = applyAvgAdvance(d, 'path_e', {
      choice: { atNodeId: 'energy_choice', optionId: 'opt_out' },
      chapter: 'EI',
    });
    expect(getAvgBranchProgressStepIndex(DEMO_AVG_SCRIPT, d.avg)).toBe(1);
  });

  it('无选项脚本时用 visited 长度作分子', () => {
    const noChoice: AvgScriptConfig = {
      script_id: 'no-choice',
      start_node_id: 'a',
      backgrounds: { x: 'from-black to-black' },
      nodes: {
        a: {
          kind: 'dialogue',
          background_key: 'x',
          lines: [{ speaker: 'narrator', text: 't' }],
          next_id: 'b',
        },
        b: { kind: 'end', background_key: 'x', lines: [{ speaker: 'narrator', text: 'end' }] },
      },
    };
    const avg = {
      script_id: noChoice.script_id,
      node_id: 'b',
      visited_node_ids: ['a', 'b'],
      answers: {},
    };
    expect(getAvgBranchProgressStepIndex(noChoice, avg)).toBe(2);
  });
});
