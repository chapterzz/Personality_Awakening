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
const PUBLISH_DIMS = ['EI', 'SN', 'TF', 'JP'] as const;
const PUBLISH_PER_DIM = 12;

/** 写入满足发布校验的最小题库（四维度各 12 题） */
async function seedPublishableQuestionBank(
  server: INestApplication['getHttpServer'],
  qid: string,
  adminToken: string,
  firstPrompt = '测试题干',
) {
  let sortOrder = 1;
  for (const dim of PUBLISH_DIMS) {
    const sides = [dim[0], dim[1]] as const;
    for (let i = 0; i < PUBLISH_PER_DIM; i++) {
      const questionId = `${qid}-${dim.toLowerCase()}-${String(i + 1).padStart(2, '0')}`;
      await request(server)
        .post(`/admin/questionnaires/${qid}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          id: questionId,
          prompt: sortOrder === 1 ? firstPrompt : `[${dim}] 题 ${i + 1}`,
          sortOrder,
          dimension: dim,
        })
        .expect(201);

      for (const side of sides) {
        await request(server)
          .post(`/admin/questions/${questionId}/options`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            id: `${questionId}-${side}`,
            label: `选项 ${side}`,
            valueKey: `${questionId}-${side}`,
            dimension: dim,
            side,
            weight: 2,
          })
          .expect(201);
      }
      sortOrder++;
    }
  }
}

jest.setTimeout(60_000);

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
    const server = app.getHttpServer();
    const firstQuestionId = `${qid}-ei-01`;

    await request(server)
      .post('/admin/questionnaires')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id: qid, title: 'E2E 测试问卷' })
      .expect(201);

    await seedPublishableQuestionBank(server, qid, adminToken, '测试题干');

    await request(server).get(`/questionnaire/${qid}`).expect(404);

    await request(server)
      .post(`/admin/questionnaires/${qid}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const pub = await request(server).get(`/questionnaire/${qid}`).expect(200);
    expect(pub.body.data.questions).toHaveLength(PUBLISH_DIMS.length * PUBLISH_PER_DIM);
    expect(pub.body.data.questions[0].prompt).toBe('测试题干');

    await request(server)
      .patch(`/admin/options/${firstQuestionId}-E`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: '更新后的选项 A' })
      .expect(200);

    await request(server)
      .post(`/admin/questionnaires/${qid}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const updated = await request(server).get(`/questionnaire/${qid}`).expect(200);
    const optA = updated.body.data.questions[0].options.find(
      (o: { id: string }) => o.id === `${firstQuestionId}-E`,
    );
    expect(optA?.label).toBe('更新后的选项 A');

    await request(server)
      .post(`/admin/questionnaires/${qid}/unpublish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    await request(server).get(`/questionnaire/${qid}`).expect(404);
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
