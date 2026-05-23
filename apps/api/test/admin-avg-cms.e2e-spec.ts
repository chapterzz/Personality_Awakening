/**
 * Admin AVG / 精灵文案 CMS 集成测试（T4.7）：角色守卫、CRUD、发布与公开 GET 一致性。
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

const E2E_AVG_PREFIX = 'e2e-admin-avg-';

/** 集成测用最小合法 nodesJson */
function minimalNodesJson() {
  return {
    start_node_id: 'intro',
    backgrounds: { night: 'from-slate-900 to-slate-950' },
    nodes: {
      intro: {
        kind: 'dialogue',
        background_key: 'night',
        lines: [{ speaker: 'narrator', text: 'hello' }],
        next_id: 'choice',
      },
      choice: {
        kind: 'choice',
        background_key: 'night',
        lines: [{ speaker: 'narrator', text: 'pick' }],
        options: [
          { id: 'a', label: 'A', next_id: 'end' },
          { id: 'b', label: 'B', next_id: 'end' },
        ],
      },
      end: {
        kind: 'end',
        background_key: 'night',
        lines: [{ speaker: 'narrator', text: 'bye' }],
      },
    },
  };
}

jest.setTimeout(30_000);

describe('Admin AVG CMS API (T4.7)', () => {
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
    const adminNickname = `${E2E_AVG_PREFIX}admin-${suffix}`;
    const studentNickname = `${E2E_AVG_PREFIX}student-${suffix}`;
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
    await prisma.avgScript.deleteMany({
      where: { id: { startsWith: E2E_AVG_PREFIX } },
    });
    await prisma.user.deleteMany({
      where: { nickname: { startsWith: E2E_AVG_PREFIX } },
    });
    await app.close();
  });

  it('GET /admin/avg-scripts as STUDENT returns 403', async () => {
    await request(app.getHttpServer())
      .get('/admin/avg-scripts')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);
  });

  it('AVG CRUD + 发布/下架：公开 GET 与 isPublished 一致', async () => {
    const scriptId = `${E2E_AVG_PREFIX}${randomUUID().slice(0, 8)}`;
    const nodesJson = minimalNodesJson();

    await request(app.getHttpServer())
      .post('/admin/avg-scripts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id: scriptId, title: 'E2E AVG 测试' })
      .expect(201);

    await request(app.getHttpServer())
      .put(`/admin/avg-scripts/${scriptId}/nodes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nodesJson })
      .expect(200);

    await request(app.getHttpServer()).get(`/avg-script/${scriptId}`).expect(404);

    await request(app.getHttpServer())
      .post(`/admin/avg-scripts/${scriptId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const pub = await request(app.getHttpServer()).get(`/avg-script/${scriptId}`).expect(200);
    expect(pub.body.data.script_id).toBe(scriptId);
    expect(pub.body.data.nodes.intro.lines[0].text).toBe('hello');

    const updatedNodes = structuredClone(nodesJson) as ReturnType<typeof minimalNodesJson>;
    updatedNodes.nodes.intro.lines[0].text = 'updated line';
    await request(app.getHttpServer())
      .put(`/admin/avg-scripts/${scriptId}/nodes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nodesJson: updatedNodes })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/admin/avg-scripts/${scriptId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const updated = await request(app.getHttpServer()).get(`/avg-script/${scriptId}`).expect(200);
    expect(updated.body.data.nodes.intro.lines[0].text).toBe('updated line');

    await request(app.getHttpServer())
      .post(`/admin/avg-scripts/${scriptId}/unpublish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    await request(app.getHttpServer()).get(`/avg-script/${scriptId}`).expect(404);
  });

  it('PUT nodes 非法 start_node_id → 400', async () => {
    const scriptId = `${E2E_AVG_PREFIX}bad-${randomUUID().slice(0, 8)}`;
    await request(app.getHttpServer())
      .post('/admin/avg-scripts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id: scriptId, title: 'Bad' })
      .expect(201);

    const bad = await request(app.getHttpServer())
      .put(`/admin/avg-scripts/${scriptId}/nodes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nodesJson: {
          start_node_id: 'ghost',
          backgrounds: {},
          nodes: { intro: { kind: 'end', background_key: 'x', lines: [] } },
        },
      })
      .expect(400);
    expect(String(bad.body.message)).toMatch(/start_node_id/);
  });

  it('精灵文案：更新 + 发布 + 公开 GET', async () => {
    const payload = {
      hesitationLines: ['E2E 犹豫提示'],
      mutexLines: {
        EI: ['E2E EI mutex'],
        SN: ['E2E SN mutex'],
        TF: ['E2E TF mutex'],
        JP: ['E2E JP mutex'],
      },
    };

    await request(app.getHttpServer())
      .put('/admin/sprite-prompts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(200);

    await request(app.getHttpServer())
      .post('/admin/sprite-prompts/publish')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const pub = await request(app.getHttpServer()).get('/sprite-prompts').expect(200);
    expect(pub.body.data.hesitationLines[0]).toBe('E2E 犹豫提示');
    expect(pub.body.data.mutexLines.EI[0]).toBe('E2E EI mutex');
  });
});
