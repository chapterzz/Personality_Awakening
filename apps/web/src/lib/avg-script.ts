/**
 * AVG 剧情配置纯函数：解析节点、判断类型、分支进度展示、与标准模式衔接判定（供引擎与单测复用，无 React 依赖）。
 */

import type { AvgNode, AvgScriptConfig } from '@/data/avg-demo-script';
import type { AvgProgressBranch, AvgProgressDataV1 } from '@/lib/progress-data';

export function getAvgNode(config: AvgScriptConfig, nodeId: string): AvgNode | undefined {
  return config.nodes[nodeId];
}

export function isAvgEndNode(node: AvgNode): boolean {
  return node.kind === 'end';
}

/**
 * 当前 AVG 快照是否已到达给定脚本下的 `end` 节点（`script_id` 须一致）。
 * 用于标准测评页：同会话从 AVG 收束后允许写入标准卷初值，避免仅靠 UI「已完成」而服务端仍为 AVG 的错位。
 */
export function isAvgProgressAtEndForScript(
  script: AvgScriptConfig,
  data: AvgProgressDataV1,
): boolean {
  if (data.avg.script_id !== script.script_id) return false;
  const n = getAvgNode(script, data.avg.node_id);
  return n !== undefined && isAvgEndNode(n);
}

/**
 * 结构化背景描述符：渐变始终存在作为 fallback，图片/Lottie 可选。
 * T2.6 资源懒加载基础设施。
 */
export type BackgroundDescriptor = {
  /** Tailwind 渐变类字符串（始终存在，作为 base/fallback） */
  gradientClassName: string;
  /** 图片 URL，如有配置 */
  imageUrl?: string;
  /** Lottie 动画 JSON URL，如有配置 */
  lottieUrl?: string;
};

/**
 * 从脚本配置中解析结构化背景描述符。
 * 支持两种 backgrounds 值形式：
 * - string：纯 Tailwind 渐变类名（向后兼容）
 * - AvgBackgroundEntry：结构化配置（渐变 + 图片/Lottie）
 */
export function getBackgroundDescriptor(
  config: AvgScriptConfig,
  backgroundKey: string,
): BackgroundDescriptor {
  const entry = config.backgrounds[backgroundKey];
  if (!entry) {
    return { gradientClassName: 'from-slate-900 to-slate-950' };
  }
  if (typeof entry === 'string') {
    return { gradientClassName: entry };
  }
  return {
    gradientClassName: entry.gradientClassName ?? 'from-slate-900 to-slate-950',
    imageUrl: entry.imageUrl,
    lottieUrl: entry.lottieUrl,
  };
}

/** @deprecated 使用 getBackgroundDescriptor 代替；保留仅返回渐变类名的兼容接口 */
export function getBackgroundClassName(config: AvgScriptConfig, backgroundKey: string): string {
  return getBackgroundDescriptor(config, backgroundKey).gradientClassName;
}

/** 脚本中「选项分支」节点数量，用于进度条只统计需玩家做选择的关键步（对白「继续」不计入）。 */
export function countChoiceNodes(config: AvgScriptConfig): number {
  return Object.values(config.nodes).filter((node) => node.kind === 'choice').length;
}

/** 分支进度条分母：有选项节点时用其个数，否则回退为全节点数（避免 0/0）。 */
export function getAvgBranchProgressTotalSteps(config: AvgScriptConfig): number {
  const choiceTotal = countChoiceNodes(config);
  const nodeCount = Object.keys(config.nodes).length;
  return choiceTotal > 0 ? choiceTotal : Math.max(1, nodeCount);
}

/**
 * 分支进度条分子：有选项节点时为 `answers` 键数（仅选分支后增加）；否则为已访问节点数（无分支脚本回退）。
 */
export function getAvgBranchProgressStepIndex(
  config: AvgScriptConfig,
  avg: AvgProgressBranch,
): number {
  const choiceTotal = countChoiceNodes(config);
  const answered = Object.keys(avg.answers ?? {}).length;
  const visitedLen = avg.visited_node_ids?.length ?? 1;
  return choiceTotal > 0 ? answered : visitedLen;
}
