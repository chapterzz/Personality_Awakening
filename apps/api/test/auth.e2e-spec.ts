/**
 * `/auth/register`、`/auth/login` 集成测试：JWT、游客绑定与 finalize 提交。
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { AssessmentMode } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { setupOpenApi } from '../src/openapi.setup';
import { PrismaService } from '../src/prisma/prisma.service';
import type { JwtAccessPayload } from '../src/auth/jwt-user.service';

const standardProgress = {
  schema_version: 1,
  mode: 'STANDARD',
  standard: {
    current_index: 0,
    answers: { Q1: 'a' },
  },
};

describe('Auth API (T1.5)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupOpenApi(app);
    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await prisma.testResult.deleteMany({
      where: { user: { nickname: { startsWith: 'e2e-auth-' } } },
    });
    await prisma.temporarySession.deleteMany({
      where: { sessionId: { startsWith: 'e2e-auth-' } },
    });
    await prisma.user.deleteMany({
      where: { nickname: { startsWith: 'e2e-auth-' } },
    });
  });

  it('POST /auth/register：纯注册 → JWT 含 role', async () => {
    const nickname = 'e2e-auth-' + randomUUID().slice(0, 8);
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ nickname, password: 'password-ok-1' })
      .expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token_type).toBe('Bearer');
    expect(res.body.data.user.nickname).toBe(nickname);
    expect(res.body.data.user.role).toBe('STUDENT');

    const payload = jwtService.verify<JwtAccessPayload>(res.body.data.access_token);
    expect(payload.sub).toBe(res.body.data.user.user_id);
    expect(payload.role).toBe('STUDENT');
  });

  it('POST /auth/register：重名 → 409', async () => {
    const nickname = 'e2e-auth-dup-' + randomUUID().slice(0, 8);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ nickname, password: 'password-ok-1' })
      .expect(201);
    const dup = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ nickname, password: 'password-other-2' })
      .expect(409);
    expect(dup.body.message).toBe('nickname_taken');
  });

  it('POST /auth/login：成功 / 密码错误', async () => {
    const nickname = 'e2e-auth-login-' + randomUUID().slice(0, 8);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ nickname, password: 'correct-pass-1' })
      .expect(201);

    const ok = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ nickname, password: 'correct-pass-1' })
      .expect(200);
    expect(ok.body.data.user.nickname).toBe(nickname);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ nickname, password: 'wrong-pass-xx' })
      .expect(401);
  });

  it('游客未完成：注册绑定 TemporarySession.user_id', async () => {
    const nickname = 'e2e-auth-bind-' + randomUUID().slice(0, 8);
    const sessionId = 'e2e-auth-guest-' + randomUUID();

    await request(app.getHttpServer())
      .put('/progress')
      .query({ session_id: sessionId })
      .send({
        progress_data: standardProgress,
        if_match_revision: 0,
      })
      .expect(200);

    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ nickname, password: 'password-ok-1', guest_session_id: sessionId })
      .expect(201);

    const row = await prisma.temporarySession.findUnique({ where: { sessionId } });
    expect(row?.userId).toBe(reg.body.data.user.user_id);

    const tr = await prisma.testResult.findFirst({ where: { userId: reg.body.data.user.user_id } });
    expect(tr).toBeNull();
  });

  it('游客同流程提交：注册后 TestResult 落库且会话删除', async () => {
    const nickname = 'e2e-auth-fin-' + randomUUID().slice(0, 8);
    const sessionId = 'e2e-auth-guest-fin-' + randomUUID();

    await request(app.getHttpServer())
      .put('/progress')
      .query({ session_id: sessionId })
      .send({
        progress_data: standardProgress,
        if_match_revision: 0,
      })
      .expect(200);

    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        nickname,
        password: 'password-ok-1',
        guest_session_id: sessionId,
        finalize_submission: true,
        submission: {
          mode: AssessmentMode.STANDARD,
          scores: { E: 1, I: 0 },
          mbti_type: 'ESTJ',
        },
      })
      .expect(201);

    const uid = reg.body.data.user.user_id as string;
    const results = await prisma.testResult.findMany({ where: { userId: uid } });
    expect(results).toHaveLength(1);
    expect(results[0].mbtiType).toBe('ESTJ');

    const gone = await prisma.temporarySession.findUnique({ where: { sessionId } });
    expect(gone).toBeNull();
  });
});
