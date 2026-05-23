/**
 * AVG 脚本 nodesJson 共享校验（T4.7）：节点图、choice 计分、background key、可达 end。
 */
import { VALID_DIMENSIONS } from '../questionnaire/questionnaire-validation';

const NODE_KINDS = ['dialogue', 'choice', 'end'] as const;
const DIMENSION_SIDES = {
  EI: ['E', 'I'],
  SN: ['S', 'N'],
  TF: ['T', 'F'],
  JP: ['J', 'P'],
} as const;

/** 校验失败时抛出，携带 machine-readable code */
export class AvgScriptValidationError extends Error {
  readonly name = 'AvgScriptValidationError';

  constructor(readonly code: string) {
    super(code);
  }
}

export type AvgNodesJsonInput = {
  start_node_id: string;
  backgrounds: Record<string, unknown>;
  nodes: Record<string, unknown>;
};

function assertObject(value: unknown, code: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new AvgScriptValidationError(code);
  }
  return value as Record<string, unknown>;
}

function assertNonEmptyString(value: unknown, code: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AvgScriptValidationError(code);
  }
  return value.trim();
}

function validateChoiceScoring(option: Record<string, unknown>, optionLabel: string): void {
  const hasDimension = option.dimension != null && option.dimension !== '';
  const hasSide = option.side != null && option.side !== '';
  const hasWeight = option.weight != null;

  if (!hasDimension && !hasSide && !hasWeight) {
    return;
  }
  if (!hasDimension || !hasSide || !hasWeight) {
    throw new AvgScriptValidationError(`choice_scoring_incomplete:${optionLabel}`);
  }
  if (!VALID_DIMENSIONS.includes(option.dimension as (typeof VALID_DIMENSIONS)[number])) {
    throw new AvgScriptValidationError(`choice_invalid_dimension:${optionLabel}`);
  }
  const sides = DIMENSION_SIDES[option.dimension as keyof typeof DIMENSION_SIDES];
  if (!sides || !(sides as readonly string[]).includes(String(option.side))) {
    throw new AvgScriptValidationError(`choice_invalid_side:${optionLabel}`);
  }
  const weight = Number(option.weight);
  if (!Number.isInteger(weight) || weight < 1 || weight > 3) {
    throw new AvgScriptValidationError(`choice_invalid_weight:${optionLabel}`);
  }
}

/**
 * 校验 AVG nodesJson 结构（不含 script_id）；通过则返回规范化后的对象引用。
 */
export function validateAvgNodesJson(input: AvgNodesJsonInput): AvgNodesJsonInput {
  const startNodeId = assertNonEmptyString(input.start_node_id, 'invalid_start_node_id');
  const backgrounds = assertObject(input.backgrounds, 'invalid_backgrounds');
  const nodes = assertObject(input.nodes, 'invalid_nodes');

  if (!nodes[startNodeId]) {
    throw new AvgScriptValidationError('start_node_id_not_found');
  }

  const nodeIds = Object.keys(nodes);
  const choiceOptionIds = new Set<string>();
  let endCount = 0;

  for (const nodeId of nodeIds) {
    const rawNode = nodes[nodeId];
    const node = assertObject(rawNode, `invalid_node:${nodeId}`);
    const kind = node.kind;
    if (typeof kind !== 'string' || !NODE_KINDS.includes(kind as (typeof NODE_KINDS)[number])) {
      throw new AvgScriptValidationError(`invalid_node_kind:${nodeId}`);
    }

    const bgKey = assertNonEmptyString(node.background_key, `missing_background_key:${nodeId}`);
    if (!(bgKey in backgrounds)) {
      throw new AvgScriptValidationError(`background_key_not_found:${nodeId}:${bgKey}`);
    }

    if (!Array.isArray(node.lines)) {
      throw new AvgScriptValidationError(`invalid_lines:${nodeId}`);
    }

    if (kind === 'dialogue') {
      const nextId = assertNonEmptyString(node.next_id, `missing_next_id:${nodeId}`);
      if (!nodes[nextId]) {
        throw new AvgScriptValidationError(`next_id_not_found:${nodeId}:${nextId}`);
      }
    } else if (kind === 'choice') {
      if (!Array.isArray(node.options) || node.options.length < 2) {
        throw new AvgScriptValidationError(`choice_options_too_few:${nodeId}`);
      }
      for (const rawOpt of node.options) {
        const opt = assertObject(rawOpt, `invalid_option:${nodeId}`);
        const optId = assertNonEmptyString(opt.id, `missing_option_id:${nodeId}`);
        if (choiceOptionIds.has(optId)) {
          throw new AvgScriptValidationError(`duplicate_option_id:${optId}`);
        }
        choiceOptionIds.add(optId);
        assertNonEmptyString(opt.label, `missing_option_label:${nodeId}:${optId}`);
        const nextId = assertNonEmptyString(
          opt.next_id,
          `missing_option_next_id:${nodeId}:${optId}`,
        );
        if (!nodes[nextId]) {
          throw new AvgScriptValidationError(
            `option_next_id_not_found:${nodeId}:${optId}:${nextId}`,
          );
        }
        validateChoiceScoring(opt, optId);
      }
    } else if (kind === 'end') {
      endCount += 1;
      if (node.next_id != null && node.next_id !== '') {
        throw new AvgScriptValidationError(`end_node_has_next_id:${nodeId}`);
      }
    }
  }

  if (endCount < 1) {
    throw new AvgScriptValidationError('no_end_node');
  }

  // 从 start_node_id BFS 检查可达性与孤立节点
  const visited = new Set<string>();
  const queue = [startNodeId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const node = assertObject(nodes[current], `invalid_node:${current}`);
    const kind = node.kind;

    if (kind === 'dialogue') {
      queue.push(String(node.next_id));
    } else if (kind === 'choice' && Array.isArray(node.options)) {
      for (const rawOpt of node.options) {
        const opt = assertObject(rawOpt, `invalid_option:${current}`);
        queue.push(String(opt.next_id));
      }
    }
  }

  for (const nodeId of nodeIds) {
    if (!visited.has(nodeId)) {
      throw new AvgScriptValidationError(`unreachable_node:${nodeId}`);
    }
  }

  let reachableEnd = false;
  for (const nodeId of visited) {
    if (assertObject(nodes[nodeId], `invalid_node:${nodeId}`).kind === 'end') {
      reachableEnd = true;
      break;
    }
  }
  if (!reachableEnd) {
    throw new AvgScriptValidationError('no_reachable_end');
  }

  return input;
}
