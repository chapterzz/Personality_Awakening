/**
 * T2.7 自适应题库 Seed 脚本：向数据库填充演示问卷数据（screening + follow-up 分组）。
 * T4.7：追加 AVG 演示脚本与精灵文案默认配置。
 * 运行方式：npx pnpm run db:seed
 */
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  DEFAULT_SPRITE_HESITATION_LINES,
  DEFAULT_SPRITE_MUTEX_LINES,
  DEMO_AVG_NODES_JSON,
  DEMO_AVG_SCRIPT_ID,
  DEMO_AVG_SCRIPT_TITLE,
} from './seed-avg-data';

const prisma = new PrismaClient();

const ADMIN_NICKNAME = 'ppa-admin';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'ppa-admin-dev';

const QUESTIONNAIRE_ID = 'adaptive-demo-v1';
const QUESTIONNAIRE_TITLE = '自适应 MBTI 演示问卷';

/** 题目定义：screening 为筛选轮（每维度 2 题），follow-up 为追问轮（每维度 1 题） */
const questions = [
  // === 筛选轮：每维度 2 题 ===

  // EI 维度筛选题
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
        weight: 1,
      },
      {
        id: 'sq01_B',
        label: '独自看书、听音乐或发呆',
        valueKey: 'sq01_B',
        dimension: 'EI',
        side: 'I',
        weight: 1,
      },
    ],
  },
  {
    id: 'sq13',
    prompt: '与朋友相处时，你更倾向于？',
    sortOrder: 5,
    dimension: 'EI',
    groupTag: 'screening',
    groupSortOrder: 2,
    options: [
      {
        id: 'sq13_A',
        label: '主动发起话题和活动',
        valueKey: 'sq13_A',
        dimension: 'EI',
        side: 'E',
        weight: 1,
      },
      {
        id: 'sq13_B',
        label: '等待对方先开口',
        valueKey: 'sq13_B',
        dimension: 'EI',
        side: 'I',
        weight: 1,
      },
    ],
  },

  // SN 维度筛选题
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
        weight: 1,
      },
      {
        id: 'sq02_B',
        label: '整体概念与可能性',
        valueKey: 'sq02_B',
        dimension: 'SN',
        side: 'N',
        weight: 1,
      },
    ],
  },
  {
    id: 'sq14',
    prompt: '解决问题时，你更倾向于？',
    sortOrder: 6,
    dimension: 'SN',
    groupTag: 'screening',
    groupSortOrder: 2,
    options: [
      {
        id: 'sq14_A',
        label: '用已验证的方法',
        valueKey: 'sq14_A',
        dimension: 'SN',
        side: 'S',
        weight: 1,
      },
      {
        id: 'sq14_B',
        label: '尝试新的可能性',
        valueKey: 'sq14_B',
        dimension: 'SN',
        side: 'N',
        weight: 1,
      },
    ],
  },

  // TF 维度筛选题
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
        weight: 1,
      },
      {
        id: 'sq03_B',
        label: '感受、价值与对人的影响',
        valueKey: 'sq03_B',
        dimension: 'TF',
        side: 'F',
        weight: 1,
      },
    ],
  },
  {
    id: 'sq15',
    prompt: '评价一个方案时，你更看重？',
    sortOrder: 7,
    dimension: 'TF',
    groupTag: 'screening',
    groupSortOrder: 2,
    options: [
      {
        id: 'sq15_A',
        label: '逻辑严密性和可行性',
        valueKey: 'sq15_A',
        dimension: 'TF',
        side: 'T',
        weight: 1,
      },
      {
        id: 'sq15_B',
        label: '对相关人的影响',
        valueKey: 'sq15_B',
        dimension: 'TF',
        side: 'F',
        weight: 1,
      },
    ],
  },

  // JP 维度筛选题
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
        weight: 1,
      },
      {
        id: 'sq04_B',
        label: '先动手试，边做边调整',
        valueKey: 'sq04_B',
        dimension: 'JP',
        side: 'P',
        weight: 1,
      },
    ],
  },
  {
    id: 'sq16',
    prompt: '安排周末计划时，你更倾向于？',
    sortOrder: 8,
    dimension: 'JP',
    groupTag: 'screening',
    groupSortOrder: 2,
    options: [
      {
        id: 'sq16_A',
        label: '提前规划好每个时段',
        valueKey: 'sq16_A',
        dimension: 'JP',
        side: 'J',
        weight: 1,
      },
      {
        id: 'sq16_B',
        label: '随心所欲，临时决定',
        valueKey: 'sq16_B',
        dimension: 'JP',
        side: 'P',
        weight: 1,
      },
    ],
  },

  // === 追问轮：每维度 1 题 ===

  // EI 追问轮
  {
    id: 'sq05',
    prompt: '在人群中，你通常？',
    sortOrder: 9,
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

  // SN 追问轮
  {
    id: 'sq07',
    prompt: '描述未来时，你更常用？',
    sortOrder: 10,
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

  // TF 追问轮
  {
    id: 'sq09',
    prompt: '同学向你求助冲突时，你更先考虑？',
    sortOrder: 11,
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

  // JP 追问轮
  {
    id: 'sq11',
    prompt: '临近截止日期时，你更倾向？',
    sortOrder: 12,
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
];

/** T4.6：写入 ADMIN 运营账号（密码来自 SEED_ADMIN_PASSWORD，默认仅开发） */
async function seedAdminUser(): Promise<void> {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { nickname: ADMIN_NICKNAME },
    update: { passwordHash, role: UserRole.ADMIN, isDeleted: false },
    create: {
      nickname: ADMIN_NICKNAME,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });
  console.log(`Seeded admin user "${ADMIN_NICKNAME}" (role ADMIN).`);
}

/** T4.7：写入 AVG 演示脚本与精灵文案（已发布，供学生端 API 拉取） */
async function seedAvgAndSpritePrompts(): Promise<void> {
  await prisma.avgScript.upsert({
    where: { id: DEMO_AVG_SCRIPT_ID },
    update: {
      title: DEMO_AVG_SCRIPT_TITLE,
      nodesJson: DEMO_AVG_NODES_JSON,
      isPublished: true,
      publishedAt: new Date(),
    },
    create: {
      id: DEMO_AVG_SCRIPT_ID,
      title: DEMO_AVG_SCRIPT_TITLE,
      nodesJson: DEMO_AVG_NODES_JSON,
      isPublished: true,
      publishedAt: new Date(),
    },
  });
  console.log(`Seeded AVG script "${DEMO_AVG_SCRIPT_ID}".`);

  await prisma.spritePromptConfig.upsert({
    where: { id: 'default' },
    update: {
      hesitationLines: DEFAULT_SPRITE_HESITATION_LINES,
      mutexLines: DEFAULT_SPRITE_MUTEX_LINES,
      isPublished: true,
      publishedAt: new Date(),
    },
    create: {
      id: 'default',
      hesitationLines: DEFAULT_SPRITE_HESITATION_LINES,
      mutexLines: DEFAULT_SPRITE_MUTEX_LINES,
      isPublished: true,
      publishedAt: new Date(),
    },
  });
  console.log('Seeded sprite prompt config "default".');
}

async function main() {
  console.log('Seeding adaptive question bank...');
  await seedAdminUser();

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

  // 先删除旧的题目和选项（避免残留数据）
  const existingQuestions = await prisma.standardQuestion.findMany({
    where: { questionnaireId: QUESTIONNAIRE_ID },
    select: { id: true },
  });
  const existingIds = existingQuestions.map((q) => q.id);
  const newIds = questions.map((q) => q.id);
  const toDelete = existingIds.filter((id) => !newIds.includes(id));

  if (toDelete.length > 0) {
    console.log(`Deleting ${toDelete.length} obsolete questions: ${toDelete.join(', ')}`);
    await prisma.standardQuestionOption.deleteMany({
      where: { questionId: { in: toDelete } },
    });
    await prisma.standardQuestion.deleteMany({
      where: { id: { in: toDelete } },
    });
  }

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

  await seedAvgAndSpritePrompts();
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
