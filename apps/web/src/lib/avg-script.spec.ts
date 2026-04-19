/**
 * AVG 剧情纯函数单测：背景 key 回退、与标准模式衔接的「已收束」判定。
 */
import { describe, expect, it } from 'vitest';

import { DEMO_AVG_SCRIPT } from '@/data/avg-demo-script';

import {
  countChoiceNodes,
  getBackgroundClassName,
  isAvgProgressAtEndForScript,
} from './avg-script';
import { createInitialAvgProgress, type AvgProgressDataV1 } from './progress-data';

describe('countChoiceNodes', () => {
  it('演示脚本仅一处选项分支', () => {
    expect(countChoiceNodes(DEMO_AVG_SCRIPT)).toBe(1);
  });
});

describe('getBackgroundClassName', () => {
  it('返回已配置渐变类名', () => {
    expect(getBackgroundClassName(DEMO_AVG_SCRIPT, 'night')).toContain('indigo');
  });

  it('未知 key 时回退默认渐变', () => {
    expect(getBackgroundClassName(DEMO_AVG_SCRIPT, 'missing')).toContain('slate');
  });
});

describe('isAvgProgressAtEndForScript', () => {
  it('node_id 为脚本内 end 节点且 script_id 一致时为 true', () => {
    const atClosing: AvgProgressDataV1 = {
      schema_version: 1,
      mode: 'AVG',
      avg: {
        script_id: DEMO_AVG_SCRIPT.script_id,
        node_id: 'closing',
        chapter: 'EI',
        answers: { energy_choice: 'opt_in' },
        visited_node_ids: ['intro', 'energy_choice', 'path_i', 'closing'],
      },
    };
    expect(isAvgProgressAtEndForScript(DEMO_AVG_SCRIPT, atClosing)).toBe(true);
  });

  it('仍在开场节点时为 false', () => {
    const intro = createInitialAvgProgress(DEMO_AVG_SCRIPT.script_id, 'intro', 'EI');
    expect(isAvgProgressAtEndForScript(DEMO_AVG_SCRIPT, intro)).toBe(false);
  });

  it('script_id 与配置不一致时为 false（防串脚本）', () => {
    const atClosing: AvgProgressDataV1 = {
      schema_version: 1,
      mode: 'AVG',
      avg: {
        script_id: 'other-script',
        node_id: 'closing',
        chapter: 'EI',
        answers: {},
      },
    };
    expect(isAvgProgressAtEndForScript(DEMO_AVG_SCRIPT, atClosing)).toBe(false);
  });
});
