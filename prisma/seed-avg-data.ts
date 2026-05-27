/**
 * T4.7 Seed 数据：AVG 演示脚本 nodesJson 与精灵文案（与 apps/web/src/data 常量对齐）。
 */

export const DEMO_AVG_SCRIPT_ID = 'demo-avg-v1';
export const DEMO_AVG_SCRIPT_TITLE = '星港夜话';

/** DB 存储格式：不含 script_id，由 API 层注入 */
export const DEMO_AVG_NODES_JSON = {
  start_node_id: 'intro',
  backgrounds: {
    night: {
      gradientClassName: 'from-indigo-950 via-slate-900 to-slate-950',
      imageUrl: '/assets/backgrounds/Leadenhall-Market.jpg',
    },
    aurora: {
      gradientClassName: 'from-emerald-950/80 via-teal-900/90 to-slate-950',
      imageUrl: '/assets/backgrounds/Lambeth-Bridge.jpg',
    },
    dawn: {
      gradientClassName: 'from-amber-950/90 via-orange-900/80 to-slate-950',
    },
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
        {
          id: 'opt_out',
          label: '更常约朋友、参加活动',
          next_id: 'path_e',
          dimension: 'EI',
          side: 'E',
          weight: 2,
        },
        {
          id: 'opt_in',
          label: '更常独处或小范围相处',
          next_id: 'path_i',
          dimension: 'EI',
          side: 'I',
          weight: 2,
        },
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
} as const;

export const DEFAULT_SPRITE_HESITATION_LINES = [
  '你在犹豫吗？不必完美，选更像“现在的你”的那一侧就好。',
  '如果两个都像你，也没关系。先凭第一直觉选一个。',
  '想一想：这个场景里，你更常做的是哪一个？',
];

export const DEFAULT_SPRITE_MUTEX_LINES = {
  EI: ['E 和 I 都很有你！也许你会在不同场景切换能量模式？', '你在外放和内收之间来回摇摆呢～'],
  SN: ['S 与 N 都被你点亮了：既看细节也看可能性？', '你在“具体”与“想象”之间反复横跳～'],
  TF: ['T 与 F 都很强：既讲道理也很在意感受。', '你在理性与共情之间有点纠结哦～'],
  JP: ['J 与 P 都有你：计划与随性并存。', '你在“按部就班”和“临场发挥”之间摇摆呢～'],
};
