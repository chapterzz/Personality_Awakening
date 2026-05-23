/**
 * Admin 题库/AVG CMS 导入导出集成测试（Task 5）：角色守卫、JSON 导入导出与冲突策略。
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

const E2E_PREFIX = 'e2e-import-';

/** 构建含 2 道 screening 题、每题 2 选项的合法问卷 JSON */
function buildQuestionnaireJson(qid: string, title: string) {
  return {
    schema_version: 1,
    id: qid,
    title,
    questions: [
      {
        id: `${qid}-q1`,
        prompt: '你更倾向独处还是社交？',
        sort_order: 0,
        dimension: 'EI',
        group_tag: 'screening',
        group_sort_order: 0,
        options: [
          {
            id: `${qid}-q1-a`,
            label: '独处',
            value_key: `${qid}-q1-a`,
            dimension: 'EI',
            side: 'I',
            weight: 2,
          },
          {
            id: `${qid}-q1-b`,
            label: '社交',
            value_key: `${qid}-q1-b`,
            dimension: 'EI',
            side: 'E',
            weight: 2,
          },
        ],
      },
      {
        id: `${qid}-q2`,
        prompt: '你更关注事实还是可能性？',
        sort_order: 1,
        dimension: 'SN',
        group_tag: 'screening',
        group_sort_order: 1,
        options: [
          {
            id: `${qid}-q2-a`,
            label: '事实',
            value_key: `${qid}-q2-a`,
            dimension: 'SN',
            side: 'S',
            weight: 2,
          },
          {
            id: `${qid}-q2-b`,
            label: '可能性',
            value_key: `${qid}-q2-b`,
            dimension: 'SN',
            side: 'N',
            weight: 2,
          },
        ],
      },
    ],
  };
}

/** 最小合法 AVG 脚本 JSON（dialogue + end） */
function buildAvgJson(scriptId: string, title: string) {
  return {
    schema_version: 1,
    id: scriptId,
    title,
    start_node_id: 'start',
    backgrounds: { bg: 'gradient' },
    nodes: {
      start: {
        kind: 'dialogue',
        background_key: 'bg',
        lines: [{ speaker: 'narrator', text: 'hi' }],
        next_id: 'end',
      },
      end: {
        kind: 'end',
        background_key: 'bg',
        lines: [],
        next_id: '',
      },
    },
  };
}

jest.setTimeout(30_000);

describe('Admin Import/Export API (Task 5)', () => {
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
    const adminNickname = `${E2E_PREFIX}admin-${suffix}`;
    const studentNickname = `${E2E_PREFIX}student-${suffix}`;
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
      where: { question: { questionnaireId: { startsWith: E2E_PREFIX } } },
    });
    await prisma.standardQuestion.deleteMany({
      where: { questionnaireId: { startsWith: E2E_PREFIX } },
    });
    await prisma.standardQuestionnaire.deleteMany({
      where: { id: { startsWith: E2E_PREFIX } },
    });
    await prisma.avgScript.deleteMany({
      where: { id: { startsWith: E2E_PREFIX } },
    });
    await prisma.user.deleteMany({
      where: { nickname: { startsWith: E2E_PREFIX } },
    });
    await app.close();
  });

  it('STUDENT POST /admin/questionnaires/import → 403', async () => {
    const payload = buildQuestionnaireJson(`${E2E_PREFIX}forbidden-q`, 'Forbidden');
    await request(app.getHttpServer())
      .post('/admin/questionnaires/import?format=json&on_conflict=create_new')
      .set('Authorization', `Bearer ${studentToken}`)
      .attach('file', Buffer.from(JSON.stringify(payload)), {
        filename: 'test.json',
        contentType: 'application/json',
      })
      .expect(403);
  });

  it('STUDENT GET /admin/questionnaires/export-all → 403', async () => {
    await request(app.getHttpServer())
      .get('/admin/questionnaires/export-all?format=json')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);
  });

  describe('Questionnaire import/export flow', () => {
    const qid = `${E2E_PREFIX}q-${randomUUID().slice(0, 8)}`;
    let importPayload: ReturnType<typeof buildQuestionnaireJson>;

    it('imports questionnaire via JSON multipart', async () => {
      importPayload = buildQuestionnaireJson(qid, 'E2E 导入问卷');
      const res = await request(app.getHttpServer())
        .post('/admin/questionnaires/import?format=json&on_conflict=create_new')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(JSON.stringify(importPayload)), {
          filename: 'test.json',
          contentType: 'application/json',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.imported).toEqual([{ id: qid, title: 'E2E 导入问卷' }]);
    });

    it('GET export single JSON — attachment content-type and body contains id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/admin/questionnaires/${qid}/export?format=json`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.headers['content-disposition']).toMatch(/attachment/);
      const parsed = JSON.parse(res.text) as { id: string; schema_version: number };
      expect(parsed.schema_version).toBe(1);
      expect(parsed.id).toBe(qid);
    });

    it('dry_run import with existing id — conflicts in response data', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/questionnaires/import?format=json&dry_run=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(JSON.stringify(importPayload)), {
          filename: 'test.json',
          contentType: 'application/json',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.valid).toBe(true);
      expect(res.body.data.conflicts).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: qid })]),
      );
    });

    it('overwrite import — updated title visible in detail', async () => {
      const updated = { ...importPayload, title: 'E2E 覆盖后标题' };
      await request(app.getHttpServer())
        .post('/admin/questionnaires/import?format=json&on_conflict=overwrite')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(JSON.stringify(updated)), {
          filename: 'test.json',
          contentType: 'application/json',
        })
        .expect(201);

      const detail = await request(app.getHttpServer())
        .get(`/admin/questionnaires/${qid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(detail.body.data.title).toBe('E2E 覆盖后标题');
      expect(detail.body.data.questions).toHaveLength(2);
    });

    it('cancel import with conflict → 409 import_conflict', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/questionnaires/import?format=json&on_conflict=cancel')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(JSON.stringify(importPayload)), {
          filename: 'test.json',
          contentType: 'application/json',
        })
        .expect(409);

      expect(res.body.message).toBe('import_conflict');
    });

    it('export-all JSON — parsed body has questionnaires array', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/questionnaires/export-all?format=json')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-disposition']).toMatch(/attachment/);
      const parsed = JSON.parse(res.text) as {
        schema_version: number;
        questionnaires: Array<{ id: string }>;
      };
      expect(parsed.schema_version).toBe(1);
      expect(Array.isArray(parsed.questionnaires)).toBe(true);
      expect(parsed.questionnaires.some((q) => q.id === qid)).toBe(true);
    });
  });

  describe('AVG import/export flow', () => {
    const scriptId = `${E2E_PREFIX}avg-${randomUUID().slice(0, 8)}`;
    let importPayload: ReturnType<typeof buildAvgJson>;

    it('imports minimal valid AVG JSON', async () => {
      importPayload = buildAvgJson(scriptId, 'E2E AVG 导入');
      const res = await request(app.getHttpServer())
        .post('/admin/avg-scripts/import?on_conflict=create_new')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(JSON.stringify(importPayload)), {
          filename: 'test.json',
          contentType: 'application/json',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.imported).toEqual([{ id: scriptId, title: 'E2E AVG 导入' }]);
    });

    it('export single JSON round-trip', async () => {
      const res = await request(app.getHttpServer())
        .get(`/admin/avg-scripts/${scriptId}/export`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.headers['content-disposition']).toMatch(/attachment/);
      const parsed = JSON.parse(res.text) as {
        schema_version: number;
        id: string;
        start_node_id: string;
        nodes: Record<string, unknown>;
      };
      expect(parsed.schema_version).toBe(1);
      expect(parsed.id).toBe(scriptId);
      expect(parsed.start_node_id).toBe('start');
      expect(parsed.nodes.start).toBeDefined();
    });

    it('overwrite import — updated title in detail', async () => {
      const updated = { ...importPayload, title: 'E2E AVG 覆盖标题' };
      await request(app.getHttpServer())
        .post('/admin/avg-scripts/import?on_conflict=overwrite')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(JSON.stringify(updated)), {
          filename: 'test.json',
          contentType: 'application/json',
        })
        .expect(201);

      const detail = await request(app.getHttpServer())
        .get(`/admin/avg-scripts/${scriptId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(detail.body.data.title).toBe('E2E AVG 覆盖标题');
    });
  });
});
