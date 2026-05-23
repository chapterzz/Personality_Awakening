/**
 * AVG 脚本 nodesJson 校验器单元测试（T4.7）。
 */
import { AvgScriptValidationError, validateAvgNodesJson } from './avg-script-validation';

/** 最小合法脚本，供正向用例复用 */
function minimalValidScript() {
  return {
    start_node_id: 'intro',
    backgrounds: { night: 'from-slate-900 to-slate-950' },
    nodes: {
      intro: {
        kind: 'dialogue',
        background_key: 'night',
        lines: [{ speaker: 'narrator', text: 'hello' }],
        next_id: 'choice',
      },
      choice: {
        kind: 'choice',
        background_key: 'night',
        lines: [{ speaker: 'narrator', text: 'pick' }],
        options: [
          { id: 'a', label: 'A', next_id: 'end' },
          { id: 'b', label: 'B', next_id: 'end' },
        ],
      },
      end: {
        kind: 'end',
        background_key: 'night',
        lines: [{ speaker: 'narrator', text: 'bye' }],
      },
    },
  };
}

describe('validateAvgNodesJson', () => {
  it('rejects when start_node_id missing from nodes', () => {
    expect(() =>
      validateAvgNodesJson({
        start_node_id: 'ghost',
        backgrounds: {},
        nodes: { intro: { kind: 'end', background_key: 'x', lines: [] } },
      }),
    ).toThrow(/start_node_id/);
  });

  it('accepts minimal valid script', () => {
    expect(() => validateAvgNodesJson(minimalValidScript())).not.toThrow();
  });

  it('rejects missing background_key definition', () => {
    const script = minimalValidScript();
    script.nodes.intro.background_key = 'missing';
    expect(() => validateAvgNodesJson(script)).toThrow(AvgScriptValidationError);
  });

  it('rejects choice with fewer than 2 options', () => {
    const script = minimalValidScript();
    (script.nodes.choice as { options: unknown[] }).options = [
      { id: 'only', label: 'Only', next_id: 'end' },
    ];
    expect(() => validateAvgNodesJson(script)).toThrow(/choice_options_too_few/);
  });

  it('rejects incomplete choice scoring triple', () => {
    const script = minimalValidScript();
    (script.nodes.choice as { options: Record<string, unknown>[] }).options[0].dimension = 'EI';
    expect(() => validateAvgNodesJson(script)).toThrow(/choice_scoring_incomplete/);
  });

  it('rejects unreachable orphan node', () => {
    const script = minimalValidScript();
    (script.nodes as Record<string, unknown>).orphan = {
      kind: 'end',
      background_key: 'night',
      lines: [],
    };
    expect(() => validateAvgNodesJson(script)).toThrow(/unreachable_node/);
  });

  it('rejects duplicate choice option ids', () => {
    const script = minimalValidScript();
    (script.nodes.choice as { options: Record<string, unknown>[] }).options[1].id = 'a';
    expect(() => validateAvgNodesJson(script)).toThrow(/duplicate_option_id/);
  });
});
