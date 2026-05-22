/**
 * Admin 题库 CMS 集成测试（T4.6）：角色守卫、CRUD、发布/下架与公开 GET 一致性。
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { setupOpenApi } from '../src/openapi.setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtUserService } from '../src/auth/jwt-user.service';

const E2E_Q_PREFIX = 'e2e-admin-q-';

jest.setTimeout(30_000);

describe('Admin Questionnaire API (T4.6)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtUser: JwtUserService;
  let adminToken: string;
  let studentToken: string;
  let adminUserId: string;
  let studentUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    setupOpenApi(app);
    prisma = app.get(PrismaService);
    jwtUser = app.get(JwtUserService);
    await app.init();

    const suffix = randomUUID().slice(0, 8);
    const adminNickname = `${E2E_Q_PREFIX}admin-${suffix}`;
    const studentNickname = `${E2E_Q_PREFIX}student-${suffix}`;
    const passwordHash = await bcrypt.hash('test-pass-12345678', 10);

    const admin = await prisma.user.create({
      data: { nickname: adminNickname, passwordHash, role: UserRole.ADMIN },
    });
    const student = await prisma.user.create({
      data: { nickname: studentNickname, passwordHash, role: UserRole.STUDENT },
    });
    adminUserId = admin.id;
    studentUserId = student.id;
    adminToken = jwtUser.signAccessTokenForTests(adminUserId, 'ADMIN');
    studentToken = jwtUser.signAccessTokenForTests(studentUserId, 'STUDENT');
  });

  afterAll(async () => {
    await prisma.standardQuestionOption.deleteMany({
      where: { question: { questionnaireId: { startsWith: E2E_Q_PREFIX } } },
    });
    await prisma.standardQuestion.deleteMany({
      where: { questionnaireId: { startsWith: E2E_Q_PREFIX } },
    });
    await prisma.standardQuestionnaire.deleteMany({
      where: { id: { startsWith: E2E_Q_PREFIX } },
    });
    await prisma.user.deleteMany({
      where: { nickname: { startsWith: E2E_Q_PREFIX } },
    });
    await app.close();
  });

  it('GET /admin/questionnaires：无 token → 401', async () => {
    await request(app.getHttpServer()).get('/admin/questionnaires').expect(401);
  });

  it('GET /admin/questionnaires：STUDENT → 403', async () => {
    await request(app.getHttpServer())
      .get('/admin/questionnaires')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);
  });

  it('GET /admin/questionnaires：ADMIN → 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/questionnaires')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('CRUD + 发布/下架：公开 GET 与 isPublished 一致', async () => {
    const qid = `${E2E_Q_PREFIX}${randomUUID().slice(0, 8)}`;

    await request(app.getHttpServer())
      .post('/admin/questionnaires')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id: qid, title: 'E2E 测试问卷' })
      .expect(201);

    const qRes = await request(app.getHttpServer())
      .post(`/admin/questionnaires/${qid}/questions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id: `${qid}-q1`,
        prompt: '测试题干',
        sortOrder: 1,
        dimension: 'EI',
        groupTag: 'screening',
        groupSortOrder: 1,
      })
      .expect(201);

    expect(qRes.body.data.id).toBe(`${qid}-q1`);

    await request(app.getHttpServer())
      .post(`/admin/questions/${qid}-q1/options`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id: `${qid}-q1-a`,
        label: '选项 A',
        valueKey: `${qid}-q1-a`,
        dimension: 'EI',
        side: 'E',
        weight: 1,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/admin/questions/${qid}-q1/options`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id: `${qid}-q1-b`,
        label: '选项 B',
        valueKey: `${qid}-q1-b`,
        dimension: 'EI',
        side: 'I',
        weight: 1,
      })
      .expect(201);

    await request(app.getHttpServer()).get(`/questionnaire/${qid}`).expect(404);

    await request(app.getHttpServer())
      .post(`/admin/questionnaires/${qid}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const pub = await request(app.getHttpServer()).get(`/questionnaire/${qid}`).expect(200);
    expect(pub.body.data.questions).toHaveLength(1);
    expect(pub.body.data.questions[0].prompt).toBe('测试题干');

    await request(app.getHttpServer())
      .patch(`/admin/options/${qid}-q1-a`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: '更新后的选项 A' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/admin/questionnaires/${qid}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const updated = await request(app.getHttpServer()).get(`/questionnaire/${qid}`).expect(200);
    const optA = updated.body.data.questions[0].options.find(
      (o: { id: string }) => o.id === `${qid}-q1-a`,
    );
    expect(optA?.label).toBe('更新后的选项 A');

    await request(app.getHttpServer())
      .post(`/admin/questionnaires/${qid}/unpublish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    await request(app.getHttpServer()).get(`/questionnaire/${qid}`).expect(404);
  });

  it('POST 选项非法 side → 400', async () => {
    const qid = `${E2E_Q_PREFIX}bad-${randomUUID().slice(0, 8)}`;
    await request(app.getHttpServer())
      .post('/admin/questionnaires')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id: qid, title: 'Bad' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/admin/questionnaires/${qid}/questions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id: `${qid}-q1`,
        prompt: 'Q',
        sortOrder: 1,
        groupTag: 'screening',
        dimension: 'EI',
      })
      .expect(201);

    const bad = await request(app.getHttpServer())
      .post(`/admin/questions/${qid}-q1/options`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id: `${qid}-bad-opt`,
        label: 'Bad',
        valueKey: 'bad',
        dimension: 'EI',
        side: 'X',
        weight: 2,
      })
      .expect(400);
    expect(bad.body.message).toBe('invalid_side');
  });
});
