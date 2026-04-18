import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { setupOpenApi } from '../src/openapi.setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtUserService } from '../src/auth/jwt-user.service';

const standardBody = (revision: number) => ({
  progress_data: {
    schema_version: 1,
    mode: 'STANDARD',
    standard: {
      current_index: 1,
      answers: { Q1: 'opt_a' },
    },
  },
  if_match_revision: revision,
});

describe('Progress API (T1.4)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtUser: JwtUserService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupOpenApi(app);
    prisma = app.get(PrismaService);
    jwtUser = app.get(JwtUserService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await prisma.temporarySession.deleteMany({
      where: { sessionId: { startsWith: 'e2e-' } },
    });
    await prisma.user.deleteMany({
      where: { nickname: { startsWith: 'e2e-user-' } },
    });
  });

  it('GET /progress 游客 404', async () => {
    await request(app.getHttpServer())
      .get('/progress')
      .query({ session_id: 'e2e-missing-' + randomUUID() })
      .expect(404);
  });

  it('PUT → GET 游客：创建、读取、乐观锁 409', async () => {
    const sessionId = 'e2e-guest-' + randomUUID();

    const put1 = await request(app.getHttpServer())
      .put('/progress')
      .query({ session_id: sessionId })
      .send(standardBody(0))
      .expect(200);
    expect(put1.body.success).toBe(true);
    expect(put1.body.data.progress_revision).toBe(1);

    const get1 = await request(app.getHttpServer())
      .get('/progress')
      .query({ session_id: sessionId })
      .expect(200);
    expect(get1.body.data.progress_revision).toBe(1);

    const conflict = await request(app.getHttpServer())
      .put('/progress')
      .query({ session_id: sessionId })
      .send(standardBody(0))
      .expect(409);
    expect(conflict.body.success).toBe(false);
    expect(conflict.body.message).toBe('progress_revision_conflict');
    expect(conflict.body.data.progress_revision).toBe(1);

    const put2 = await request(app.getHttpServer())
      .put('/progress')
      .query({ session_id: sessionId })
      .send(standardBody(1))
      .expect(200);
    expect(put2.body.data.progress_revision).toBe(2);
  });

  it('注册用户 JWT：PUT创建与409', async () => {
    const user = await prisma.user.create({
      data: {
        nickname: 'e2e-user-' + randomUUID().slice(0, 8),
        passwordHash: 'test-hash',
      },
    });
    const token = jwtUser.signAccessTokenForTests(user.id);

    const put1 = await request(app.getHttpServer())
      .put('/progress')
      .set('Authorization', `Bearer ${token}`)
      .send(standardBody(0))
      .expect(200);
    expect(put1.body.data.user_id).toBe(user.id);
    expect(put1.body.data.progress_revision).toBe(1);

    await request(app.getHttpServer())
      .put('/progress')
      .set('Authorization', `Bearer ${token}`)
      .send(standardBody(0))
      .expect(409);

    await request(app.getHttpServer())
      .put('/progress')
      .set('Authorization', `Bearer ${token}`)
      .send(standardBody(1))
      .expect(200);
  });

  it('无效 JWT 返回 401', async () => {
    await request(app.getHttpServer())
      .get('/progress')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401);
  });

  it('无效 JWT 时 PUT /progress 也返回 401', async () => {
    await request(app.getHttpServer())
      .put('/progress')
      .set('Authorization', 'Bearer not-a-jwt')
      .send(standardBody(0))
      .expect(401);
  });

  it('无 Bearer 且无 session_id：GET/PUT 返回 400', async () => {
    await request(app.getHttpServer()).get('/progress').expect(400);
    await request(app.getHttpServer()).put('/progress').send(standardBody(0)).expect(400);
  });

  it('progress_data 非法时 PUT 返回 400', async () => {
    const sessionId = 'e2e-guest-' + randomUUID();
    await request(app.getHttpServer())
      .put('/progress')
      .query({ session_id: sessionId })
      .send({
        progress_data: {
          schema_version: 99,
          mode: 'STANDARD',
          standard: { current_index: 0, answers: {} },
        },
        if_match_revision: 0,
      })
      .expect(400);
  });

  it('游客不得读写已绑定 user_id 的 session（403）', async () => {
    const user = await prisma.user.create({
      data: {
        nickname: 'e2e-user-' + randomUUID().slice(0, 8),
        passwordHash: 'test-hash',
      },
    });
    const sessionId = 'e2e-guest-' + randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.temporarySession.create({
      data: {
        sessionId,
        userId: user.id,
        progressData: {
          schema_version: 1,
          mode: 'STANDARD',
          standard: { current_index: 0, answers: {} },
        },
        progressRevision: 1,
        expiresAt,
      },
    });

    await request(app.getHttpServer())
      .get('/progress')
      .query({ session_id: sessionId })
      .expect(403);
    await request(app.getHttpServer())
      .put('/progress')
      .query({ session_id: sessionId })
      .send(standardBody(1))
      .expect(403);
  });

  it('注册用户与游客会话隔离：JWT 写进度后新游客 session 仍可用 revision 0 创建', async () => {
    const user = await prisma.user.create({
      data: {
        nickname: 'e2e-user-' + randomUUID().slice(0, 8),
        passwordHash: 'test-hash',
      },
    });
    const token = jwtUser.signAccessTokenForTests(user.id);
    await request(app.getHttpServer())
      .put('/progress')
      .set('Authorization', `Bearer ${token}`)
      .send(standardBody(0))
      .expect(200);

    const guestSid = 'e2e-guest-' + randomUUID();
    const guestPut = await request(app.getHttpServer())
      .put('/progress')
      .query({ session_id: guestSid })
      .send(standardBody(0))
      .expect(200);
    expect(guestPut.body.data.user_id).toBeNull();
    expect(guestPut.body.data.progress_revision).toBe(1);
  });
});
