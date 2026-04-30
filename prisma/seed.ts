/**
 * T2.7 自适应题库 Seed 脚本：向数据库填充演示问卷数据（screening + follow-up 分组）。
 * 运行方式：npx pnpm run db:seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const QUESTIONNAIRE_ID = 'adaptive-demo-v1';
const QUESTIONNAIRE_TITLE = '自适应 MBTI 演示问卷';

/** 题目定义：screening 为筛选轮，follow-up 为追问轮 */
const questions = [
  // === 筛选轮：每维度 1 题 ===
  {
    id: 'sq01',
    prompt: '周末放松时，你更愿意？',
    sortOrder: 1,
    dimension: 'EI',
    groupTag: 'screening',
    groupSortOrder: 1,
    options: [
      {
        id: 'sq01_A',
        label: '和朋友外出或聊天',
        valueKey: 'sq01_A',
        dimension: 'EI',
        side: 'E',
        weight: 2,
      },
      {
        id: 'sq01_B',
        label: '独自看书、听音乐或发呆',
        valueKey: 'sq01_B',
        dimension: 'EI',
        side: 'I',
        weight: 2,
      },
    ],
  },
  {
    id: 'sq02',
    prompt: '学习新东西时，你更喜欢？',
    sortOrder: 2,
    dimension: 'SN',
    groupTag: 'screening',
    groupSortOrder: 1,
    options: [
      {
        id: 'sq02_A',
        label: '具体例子与步骤演示',
        valueKey: 'sq02_A',
        dimension: 'SN',
        side: 'S',
        weight: 2,
      },
      {
        id: 'sq02_B',
        label: '整体概念与可能性',
        valueKey: 'sq02_B',
        dimension: 'SN',
        side: 'N',
        weight: 2,
      },
    ],
  },
  {
    id: 'sq03',
    prompt: '做决定时，你更依赖？',
    sortOrder: 3,
    dimension: 'TF',
    groupTag: 'screening',
    groupSortOrder: 1,
    options: [
      {
        id: 'sq03_A',
        label: '事实、经验与可验证的信息',
        valueKey: 'sq03_A',
        dimension: 'TF',
        side: 'T',
        weight: 2,
      },
      {
        id: 'sq03_B',
        label: '感受、价值与对人的影响',
        valueKey: 'sq03_B',
        dimension: 'TF',
        side: 'F',
        weight: 2,
      },
    ],
  },
  {
    id: 'sq04',
    prompt: '面对新任务时，你通常？',
    sortOrder: 4,
    dimension: 'JP',
    groupTag: 'screening',
    groupSortOrder: 1,
    options: [
      {
        id: 'sq04_A',
        label: '先想清楚步骤再开始',
        valueKey: 'sq04_A',
        dimension: 'JP',
        side: 'J',
        weight: 2,
      },
      {
        id: 'sq04_B',
        label: '先动手试，边做边调整',
        valueKey: 'sq04_B',
        dimension: 'JP',
        side: 'P',
        weight: 2,
      },
    ],
  },

  // === EI 追问轮 ===
  {
    id: 'sq05',
    prompt: '在人群中，你通常？',
    sortOrder: 5,
    dimension: 'EI',
    groupTag: 'ei_followup',
    groupSortOrder: 1,
    options: [
      {
        id: 'sq05_A',
        label: '容易开始对话、表达想法',
        valueKey: 'sq05_A',
        dimension: 'EI',
        side: 'E',
        weight: 2,
      },
      {
        id: 'sq05_B',
        label: '先观察，再选择性发言',
        valueKey: 'sq05_B',
        dimension: 'EI',
        side: 'I',
        weight: 2,
      },
    ],
  },
  {
    id: 'sq06',
    prompt: '长时间独处后，你一般会？',
    sortOrder: 6,
    dimension: 'EI',
    groupTag: 'ei_followup',
    groupSortOrder: 2,
    options: [
      {
        id: 'sq06_A',
        label: '想找人聊聊补充能量',
        valueKey: 'sq06_A',
        dimension: 'EI',
        side: 'E',
        weight: 2,
      },
      {
        id: 'sq06_B',
        label: '觉得恢复精力即可',
        valueKey: 'sq06_B',
        dimension: 'EI',
        side: 'I',
        weight: 2,
      },
    ],
  },

  // === SN 追问轮 ===
  {
    id: 'sq07',
    prompt: '描述未来时，你更常用？',
    sortOrder: 7,
    dimension: 'SN',
    groupTag: 'sn_followup',
    groupSortOrder: 1,
    options: [
      {
        id: 'sq07_A',
        label: '具体可落地的画面',
        valueKey: 'sq07_A',
        dimension: 'SN',
        side: 'S',
        weight: 2,
      },
      {
        id: 'sq07_B',
        label: '比喻、联想与多种可能',
        valueKey: 'sq07_B',
        dimension: 'SN',
        side: 'N',
        weight: 2,
      },
    ],
  },
  {
    id: 'sq08',
    prompt: '阅读一篇文章时，你更关注？',
    sortOrder: 8,
    dimension: 'SN',
    groupTag: 'sn_followup',
    groupSortOrder: 2,
    options: [
      {
        id: 'sq08_A',
        label: '事实细节和数据',
        valueKey: 'sq08_A',
        dimension: 'SN',
        side: 'S',
        weight: 2,
      },
      {
        id: 'sq08_B',
        label: '作者的意图和深层含义',
        valueKey: 'sq08_B',
        dimension: 'SN',
        side: 'N',
        weight: 2,
      },
    ],
  },

  // === TF 追问轮 ===
  {
    id: 'sq09',
    prompt: '同学向你求助冲突时，你更先考虑？',
    sortOrder: 9,
    dimension: 'TF',
    groupTag: 'tf_followup',
    groupSortOrder: 1,
    options: [
      {
        id: 'sq09_A',
        label: '公平与规则',
        valueKey: 'sq09_A',
        dimension: 'TF',
        side: 'T',
        weight: 2,
      },
      {
        id: 'sq09_B',
        label: '和谐与感受',
        valueKey: 'sq09_B',
        dimension: 'TF',
        side: 'F',
        weight: 2,
      },
    ],
  },
  {
    id: 'sq10',
    prompt: '被批评时，你更在意？',
    sortOrder: 10,
    dimension: 'TF',
    groupTag: 'tf_followup',
    groupSortOrder: 2,
    options: [
      {
        id: 'sq10_A',
        label: '逻辑是否站得住',
        valueKey: 'sq10_A',
        dimension: 'TF',
        side: 'T',
        weight: 2,
      },
      {
        id: 'sq10_B',
        label: '对方语气是否让你难堪',
        valueKey: 'sq10_B',
        dimension: 'TF',
        side: 'F',
        weight: 2,
      },
    ],
  },

  // === JP 追问轮 ===
  {
    id: 'sq11',
    prompt: '临近截止日期时，你更倾向？',
    sortOrder: 11,
    dimension: 'JP',
    groupTag: 'jp_followup',
    groupSortOrder: 1,
    options: [
      {
        id: 'sq11_A',
        label: '提前规划并留出缓冲',
        valueKey: 'sq11_A',
        dimension: 'JP',
        side: 'J',
        weight: 2,
      },
      {
        id: 'sq11_B',
        label: '在压力下效率更高',
        valueKey: 'sq11_B',
        dimension: 'JP',
        side: 'P',
        weight: 2,
      },
    ],
  },
  {
    id: 'sq12',
    prompt: '旅行/活动计划，你更享受？',
    sortOrder: 12,
    dimension: 'JP',
    groupTag: 'jp_followup',
    groupSortOrder: 2,
    options: [
      {
        id: 'sq12_A',
        label: '清单与时间表明确',
        valueKey: 'sq12_A',
        dimension: 'JP',
        side: 'J',
        weight: 2,
      },
      {
        id: 'sq12_B',
        label: '留空白让灵感发生',
        valueKey: 'sq12_B',
        dimension: 'JP',
        side: 'P',
        weight: 2,
      },
    ],
  },
];

async function main() {
  console.log('Seeding adaptive question bank...');

  // 创建问卷
  await prisma.standardQuestionnaire.upsert({
    where: { id: QUESTIONNAIRE_ID },
    update: { title: QUESTIONNAIRE_TITLE, isPublished: true, publishedAt: new Date() },
    create: {
      id: QUESTIONNAIRE_ID,
      title: QUESTIONNAIRE_TITLE,
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  // 创建题目和选项
  for (const q of questions) {
    await prisma.standardQuestion.upsert({
      where: { id: q.id },
      update: {
        prompt: q.prompt,
        sortOrder: q.sortOrder,
        dimension: q.dimension,
        groupTag: q.groupTag,
        groupSortOrder: q.groupSortOrder,
      },
      create: {
        id: q.id,
        questionnaireId: QUESTIONNAIRE_ID,
        prompt: q.prompt,
        sortOrder: q.sortOrder,
        dimension: q.dimension,
        groupTag: q.groupTag,
        groupSortOrder: q.groupSortOrder,
      },
    });

    for (const opt of q.options) {
      await prisma.standardQuestionOption.upsert({
        where: { id: opt.id },
        update: {
          label: opt.label,
          valueKey: opt.valueKey,
          dimension: opt.dimension,
          side: opt.side,
          weight: opt.weight,
        },
        create: {
          id: opt.id,
          questionId: q.id,
          label: opt.label,
          valueKey: opt.valueKey,
          dimension: opt.dimension,
          side: opt.side,
          weight: opt.weight,
        },
      });
    }
  }

  console.log(`Seeded questionnaire "${QUESTIONNAIRE_ID}" with ${questions.length} questions.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
