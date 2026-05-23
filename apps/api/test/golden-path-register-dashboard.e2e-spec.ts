/**
 * Golden Path Tier 2：注册演示 TestResult → 看板 stats / my-comparison（T5.2）。
 */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupOpenApi } from '../src/openapi.setup';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  cleanupGoldenPath,
  registerWithDemoTestResultViaHttp,
  uniqueNickname,
} from './helpers/golden-path-helpers';

jest.setTimeout(30_000);

describe('Golden Path — Register to Dashboard (T5.2)', () => {
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
    await cleanupGoldenPath(prisma);
  });

  it('registerWithDemoTestResult 链：my-comparison 返回 INFP', async () => {
    const nickname = uniqueNickname('reg');
    const { accessToken } = await registerWithDemoTestResultViaHttp(app, {
      nickname,
      password: 'password-ok-11',
      mbtiType: 'INFP',
    });

    const cmp = await request(app.getHttpServer())
      .get('/dashboard/my-comparison')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(cmp.body.data.myType).toBe('INFP');
    expect(cmp.body.data.typeRank).toBeGreaterThanOrEqual(1);
  });

  it('同上链路：stats 类型分布含 INFP', async () => {
    const before = await request(app.getHttpServer()).get('/dashboard/stats').expect(200);
    const infpBefore =
      (before.body.data.typeDistribution as Array<{ type: string; count: number }>).find(
        (t) => t.type === 'INFP',
      )?.count ?? 0;

    const nickname = uniqueNickname('stats');
    await registerWithDemoTestResultViaHttp(app, {
      nickname,
      password: 'password-ok-11',
      mbtiType: 'INFP',
    });

    const after = await request(app.getHttpServer()).get('/dashboard/stats').expect(200);
    const infpAfter = (
      after.body.data.typeDistribution as Array<{ type: string; count: number }>
    ).find((t) => t.type === 'INFP')!.count;
    expect(infpAfter).toBeGreaterThanOrEqual(infpBefore + 1);
  });

  it('纯注册无 TestResult：my-comparison 为 null', async () => {
    const nickname = uniqueNickname('plain');
    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ nickname, password: 'password-ok-11' })
      .expect(201);

    const cmp = await request(app.getHttpServer())
      .get('/dashboard/my-comparison')
      .set('Authorization', `Bearer ${reg.body.data.access_token}`)
      .expect(200);

    expect(cmp.body.data).toBeNull();
    expect(cmp.body.message).toBe('no_test_result');
  });
});
