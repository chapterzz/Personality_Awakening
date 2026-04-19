/**
 * AVG 演示剧情（JSON 结构，后续由 CMS/T4.7 替换）；节点 id / 分支与 `progress_data.avg` 对齐。
 */

export type AvgSpeaker = 'narrator' | 'sprite' | 'player';

export type AvgLine = {
  speaker: AvgSpeaker;
  text: string;
};

export type AvgChapterTag = 'EI' | 'SN' | 'TF' | 'JP';

/** 纯对话节点：点击继续后进入 `next_id` */
export type AvgDialogueNode = {
  kind: 'dialogue';
  chapter?: AvgChapterTag;
  /** 逻辑 key，由 `backgrounds` 映射为渐变或图片 URL */
  background_key: string;
  lines: AvgLine[];
  next_id: string;
};

export type AvgChoiceOption = {
  id: string;
  label: string;
  next_id: string;
};

/** 选项分支节点 */
export type AvgChoiceNode = {
  kind: 'choice';
  chapter?: AvgChapterTag;
  background_key: string;
  lines: AvgLine[];
  options: AvgChoiceOption[];
};

/** 剧情收束（无下一步，客户端展示完成态） */
export type AvgEndNode = {
  kind: 'end';
  chapter?: AvgChapterTag;
  background_key: string;
  lines: AvgLine[];
};

export type AvgNode = AvgDialogueNode | AvgChoiceNode | AvgEndNode;

export type AvgScriptConfig = {
  script_id: string;
  start_node_id: string;
  /** 背景 key → Tailwind 渐变类名（避免演示依赖外链图床） */
  backgrounds: Record<string, string>;
  nodes: Record<string, AvgNode>;
};

export const DEMO_AVG_SCRIPT_ID = 'demo-avg-v1';

/**
 * 小型分支演示：开场对白 → 二选一 → 汇合 → 结束。
 * 与 PRD「章节与节点」进度条语义一致：可按 `chapter` 驱动 UI。
 */
export const DEMO_AVG_SCRIPT: AvgScriptConfig = {
  script_id: DEMO_AVG_SCRIPT_ID,
  start_node_id: 'intro',
  backgrounds: {
    night: 'from-indigo-950 via-slate-900 to-slate-950',
    aurora: 'from-emerald-950/80 via-teal-900/90 to-slate-950',
    dawn: 'from-amber-950/90 via-orange-900/80 to-slate-950',
  },
  nodes: {
    intro: {
      kind: 'dialogue',
      chapter: 'EI',
      background_key: 'night',
      lines: [
        { speaker: 'sprite', text: '欢迎来到性格星球。今晚我们从一个小问题开始。' },
        { speaker: 'narrator', text: '没有标准答案，选让你更舒服的那一侧即可。' },
      ],
      next_id: 'energy_choice',
    },
    energy_choice: {
      kind: 'choice',
      chapter: 'EI',
      background_key: 'aurora',
      lines: [
        {
          speaker: 'narrator',
          text: '周末有空时，你更常主动约朋友出门，还是独自充电？',
        },
      ],
      options: [
        { id: 'opt_out', label: '更常约朋友、参加活动', next_id: 'path_e' },
        { id: 'opt_in', label: '更常独处或小范围相处', next_id: 'path_i' },
      ],
    },
    path_e: {
      kind: 'dialogue',
      chapter: 'EI',
      background_key: 'dawn',
      lines: [{ speaker: 'sprite', text: '外向能量满满！记住：外向也需要休息哦。' }],
      next_id: 'closing',
    },
    path_i: {
      kind: 'dialogue',
      chapter: 'EI',
      background_key: 'night',
      lines: [{ speaker: 'sprite', text: '内向也很棒：深度专注是你的超能力。' }],
      next_id: 'closing',
    },
    closing: {
      kind: 'end',
      chapter: 'EI',
      background_key: 'aurora',
      lines: [{ speaker: 'narrator', text: '演示剧情结束。正式版将连接完整题库与报告页。' }],
    },
  },
};
