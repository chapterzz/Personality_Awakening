/**
 * T3.1 全局洞察看板演示 Seed：写入多样 MBTI 类型的 TestResult，供看板聚合与人工验收。
 * 运行方式：pnpm db:seed:dashboard
 */
import { AssessmentMode, PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const NICKNAME_PREFIX = 'seed-dashboard-';
const SEED_PASSWORD = 'seed-dashboard-demo';

/** 各类型测评条数（合计 28 条，覆盖 10 种 MBTI 类型） */
const TYPE_COUNTS: Array<{ mbtiType: string; count: number }> = [
  { mbtiType: 'INFP', count: 8 },
  { mbtiType: 'ENFP', count: 6 },
  { mbtiType: 'INTJ', count: 4 },
  { mbtiType: 'ENTP', count: 3 },
  { mbtiType: 'ISFJ', count: 2 },
  { mbtiType: 'ESTJ', count: 2 },
  { mbtiType: 'ISTP', count: 1 },
  { mbtiType: 'ENFJ', count: 1 },
  { mbtiType: 'ESFP', count: 1 },
];

/**
 * 清除此前写入的演示用户及其测评结果（按 nickname 前缀匹配）。
 */
async function clearPreviousSeed(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { nickname: { startsWith: NICKNAME_PREFIX } },
    select: { id: true },
  });
  if (users.length === 0) return;

  const userIds = users.map((u) => u.id);
  await prisma.testResult.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

/**
 * 写入演示用户与 TestResult。
 */
async function seedDashboardDemo(): Promise<void> {
  await clearPreviousSeed();

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const baseDate = Date.now();
  let userIndex = 0;
  let resultIndex = 0;

  for (const { mbtiType, count } of TYPE_COUNTS) {
    for (let i = 0; i < count; i++) {
      const nickname = `${NICKNAME_PREFIX}${String(userIndex).padStart(3, '0')}`;
      userIndex += 1;

      const user = await prisma.user.create({
        data: {
          nickname,
          passwordHash,
          role: UserRole.STUDENT,
        },
      });

      await prisma.testResult.create({
        data: {
          userId: user.id,
          mode: AssessmentMode.STANDARD,
          mbtiType,
          scores: { demo: true, seed: 'dashboard' },
          completedAt: new Date(baseDate - resultIndex * 86_400_000),
        },
      });
      resultIndex += 1;
    }
  }

  console.log(
    `Seeded ${resultIndex} dashboard demo TestResult(s) across ${TYPE_COUNTS.length} MBTI types.`,
  );
}

seedDashboardDemo()
  .catch((e) => {
    console.error('Dashboard seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
