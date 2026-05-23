/**
 * Golden Path Tier 3：测评完成态 progress → POST /scoring/mbti（T5.2 报告 API 数据）。
 */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { setupOpenApi } from '../src/openapi.setup';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  cleanupGoldenPath,
  seedGuestAdaptiveStandardComplete,
  uniqueNickname,
} from './helpers/golden-path-helpers';

jest.setTimeout(30_000);

/** 与 e2e report mock 一致的 ENTJ 等价 signals */
const ENTJ_SIGNALS = [
  { dimension: 'EI', side: 'E', weight: 3 },
  { dimension: 'SN', side: 'N', weight: 2 },
  { dimension: 'TF', side: 'T', weight: 2 },
  { dimension: 'JP', side: 'J', weight: 2 },
];

/** 与 progress.e2e-spec avgAtClosingBody 一致：AVG 收束态 progress */
const avgAtClosingBody = (revision: number) => ({
  progress_data: {
    schema_version: 1,
    mode: 'AVG' as const,
    questionnaire_id: 'demo-avg-v1',
    avg: {
      script_id: 'demo-avg-v1',
      node_id: 'closing',
      chapter: 'EI' as const,
      answers: { energy_choice: 'opt_in' },
      visited_node_ids: ['intro', 'energy_choice', 'path_i', 'closing'],
    },
    meta: { started_at: new Date().toISOString(), last_client: 'e2e' },
  },
  if_match_revision: revision,
});

/** scoring.e2e-spec 中 ISFJ 等价 AVG signals */
const AVG_ISFJ_SIGNALS = [
  { dimension: 'EI', side: 'I', weight: 3 },
  { dimension: 'SN', side: 'S', weight: 2 },
  { dimension: 'TF', side: 'F', weight: 2 },
  { dimension: 'JP', side: 'J', weight: 1 },
];

describe('Golden Path — Assessment to Scoring Report (T5.2)', () => {
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

  it('标准完成态 progress + scoring/mbti 返回 ENTJ 报告字段', async () => {
    const sessionId = `e2e-golden-sid-${randomUUID()}`;
    await seedGuestAdaptiveStandardComplete(app, sessionId);

    const score = await request(app.getHttpServer())
      .post('/scoring/mbti')
      .send({ mode: 'STANDARD', signals: ENTJ_SIGNALS })
      .expect(201);

    expect(score.body.data.mbti_type).toBe('ENTJ');
    expect(score.body.data.scores.EI.winner).toBe('E');
    expect(score.body.data.scores.SN.winner).toBe('N');
    expect(score.body.data.scores.TF.winner).toBe('T');
    expect(score.body.data.scores.JP.winner).toBe('J');
  });

  it('AVG 收束 progress + scoring/mbti 返回 ISFJ', async () => {
    const sessionId = `e2e-golden-sid-${randomUUID()}`;

    await request(app.getHttpServer())
      .put('/progress')
      .query({ mode: 'AVG', session_id: sessionId })
      .send(avgAtClosingBody(0))
      .expect(200);

    const score = await request(app.getHttpServer())
      .post('/scoring/mbti')
      .send({ mode: 'AVG', signals: AVG_ISFJ_SIGNALS })
      .expect(201);

    expect(score.body.data.mode).toBe('AVG');
    expect(score.body.data.mbti_type).toBe('ISFJ');
  });

  it('完成态 + register finalize：my-comparison 含 submission 类型', async () => {
    const sessionId = `e2e-golden-sid-${randomUUID()}`;
    await seedGuestAdaptiveStandardComplete(app, sessionId);
    const nickname = uniqueNickname('fin');

    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        nickname,
        password: 'password-ok-11',
        guest_session_id: sessionId,
        finalize_submission: true,
        submission: {
          mode: 'STANDARD',
          scores: { E: 1, I: 0, N: 1, T: 1, J: 1 },
          mbti_type: 'ENTJ',
        },
      })
      .expect(201);

    const cmp = await request(app.getHttpServer())
      .get('/dashboard/my-comparison')
      .set('Authorization', `Bearer ${reg.body.data.access_token}`)
      .expect(200);

    expect(cmp.body.data.myType).toBe('ENTJ');
  });
});
