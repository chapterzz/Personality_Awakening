/**
 * `/dashboard` API 集成测试（T3.1）：公开 stats 聚合与个人对比 JWT 鉴权。
 */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentMode } from '@prisma/client';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { setupOpenApi } from '../src/openapi.setup';
import { PrismaService } from '../src/prisma/prisma.service';

jest.setTimeout(30_000);

const E2E_PREFIX = 'e2e-dashboard-';

/** 清理本套件写入的用户与测评结果 */
async function cleanupDashboardE2E(prisma: PrismaService): Promise<void> {
  const users = await prisma.user.findMany({
    where: { nickname: { startsWith: E2E_PREFIX } },
    select: { id: true },
  });
  if (users.length === 0) return;
  const userIds = users.map((u) => u.id);
  await prisma.testResult.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

describe('Dashboard API (T3.1)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupOpenApi(app);
    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await cleanupDashboardE2E(prisma);
  });

  it('GET /dashboard/stats：响应结构与设计文档一致', async () => {
    const res = await request(app.getHttpServer()).get('/dashboard/stats').expect(200);

    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.totalUsers).toBe('number');
    expect(res.body.data.typeDistribution).toHaveLength(16);
    expect(res.body.data.typeDistribution[0]).toMatchObject({
      type: expect.any(String),
      count: expect.any(Number),
    });
    expect(Array.isArray(res.body.data.spriteHeatmap)).toBe(true);
    expect(res.body.data.funInsights).toMatchObject({
      mostCommonType: expect.objectContaining({
        type: expect.any(String),
        count: expect.any(Number),
      }),
      rarestType: expect.objectContaining({ type: expect.any(String), count: expect.any(Number) }),
      mostPopularSprite: expect.objectContaining({
        sprite: expect.any(String),
        count: expect.any(Number),
      }),
      dimensionBalance: expect.objectContaining({
        E: expect.any(Number),
        I: expect.any(Number),
        S: expect.any(Number),
        N: expect.any(Number),
        T: expect.any(Number),
        F: expect.any(Number),
        J: expect.any(Number),
        P: expect.any(Number),
      }),
    });
  });

  it('GET /dashboard/stats：有 TestResult 时聚合正确', async () => {
    const suffix = randomUUID().slice(0, 8);
    const userA = await prisma.user.create({
      data: {
        nickname: `${E2E_PREFIX}a-${suffix}`,
        passwordHash: 'hash',
        role: 'STUDENT',
      },
    });
    const userB = await prisma.user.create({
      data: {
        nickname: `${E2E_PREFIX}b-${suffix}`,
        passwordHash: 'hash',
        role: 'STUDENT',
      },
    });

    await prisma.testResult.createMany({
      data: [
        {
          userId: userA.id,
          mode: AssessmentMode.STANDARD,
          mbtiType: 'INFP',
          scores: {},
          completedAt: new Date(),
        },
        {
          userId: userB.id,
          mode: AssessmentMode.STANDARD,
          mbtiType: 'ENFP',
          scores: {},
          completedAt: new Date(),
        },
        {
          userId: userB.id,
          mode: AssessmentMode.STANDARD,
          mbtiType: 'INFP',
          scores: {},
          completedAt: new Date(),
        },
      ],
    });

    const res = await request(app.getHttpServer()).get('/dashboard/stats').expect(200);

    expect(res.body.data.totalUsers).toBeGreaterThanOrEqual(3);
    const distribution = res.body.data.typeDistribution as Array<{ type: string; count: number }>;
    expect(distribution[0].count).toBeGreaterThanOrEqual(distribution[1]?.count ?? 0);

    const infp = distribution.find((t) => t.type === 'INFP');
    const enfp = distribution.find((t) => t.type === 'ENFP');
    expect(infp!.count).toBeGreaterThanOrEqual(2);
    expect(enfp!.count).toBeGreaterThanOrEqual(1);

    const heatmap = res.body.data.spriteHeatmap as Array<{ type: string; sprite: string }>;
    expect(heatmap.some((h) => h.sprite === '月影探索精灵')).toBe(true);
    expect(heatmap.some((h) => h.sprite === '曦光领航精灵')).toBe(true);

    expect(res.body.data.funInsights.dimensionBalance).toHaveProperty('E');
    expect(res.body.data.funInsights.dimensionBalance).toHaveProperty('P');
  });

  it('GET /dashboard/my-comparison：无 Authorization → 401', async () => {
    await request(app.getHttpServer()).get('/dashboard/my-comparison').expect(401);
  });

  it('GET /dashboard/my-comparison：已登录无 TestResult → data null', async () => {
    const nickname = `${E2E_PREFIX}no-tr-${randomUUID().slice(0, 8)}`;
    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ nickname, password: 'password-ok-1' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/dashboard/my-comparison')
      .set('Authorization', `Bearer ${reg.body.data.access_token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeNull();
    expect(res.body.message).toBe('no_test_result');
  });

  it('GET /dashboard/my-comparison：有 TestResult 时返回类型对比', async () => {
    const suffix = randomUUID().slice(0, 8);
    const nickname = `${E2E_PREFIX}cmp-${suffix}`;

    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ nickname, password: 'password-ok-1' })
      .expect(201);

    const userId = reg.body.data.user.user_id as string;

    await prisma.testResult.create({
      data: {
        userId,
        mode: AssessmentMode.STANDARD,
        mbtiType: 'INFP',
        scores: {},
        completedAt: new Date(),
      },
    });

    await prisma.user.create({
      data: {
        nickname: `${E2E_PREFIX}other-${suffix}`,
        passwordHash: 'hash',
        role: 'STUDENT',
      },
    });
    const other = await prisma.user.findFirst({
      where: { nickname: `${E2E_PREFIX}other-${suffix}` },
    });
    await prisma.testResult.create({
      data: {
        userId: other!.id,
        mode: AssessmentMode.STANDARD,
        mbtiType: 'ENFP',
        scores: {},
        completedAt: new Date(),
      },
    });

    const res = await request(app.getHttpServer())
      .get('/dashboard/my-comparison')
      .set('Authorization', `Bearer ${reg.body.data.access_token}`)
      .expect(200);

    expect(res.body.data.myType).toBe('INFP');
    expect(res.body.data.typeRank).toBeGreaterThanOrEqual(1);
    expect(typeof res.body.data.typePercentage).toBe('number');
  });
});
