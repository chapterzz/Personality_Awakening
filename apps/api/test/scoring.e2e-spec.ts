/**
 * `/scoring/mbti` API 集成测试：验证 STANDARD/AVG 计分与请求校验。
 */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupOpenApi } from '../src/openapi.setup';

jest.setTimeout(30_000);

describe('Scoring API (T2.4)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupOpenApi(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /scoring/mbti computes STANDARD signals', async () => {
    const res = await request(app.getHttpServer())
      .post('/scoring/mbti')
      .send({
        mode: 'STANDARD',
        signals: [
          { dimension: 'EI', side: 'E', weight: 2 },
          { dimension: 'EI', side: 'I', weight: 1 },
          { dimension: 'SN', side: 'N', weight: 2 },
          { dimension: 'TF', side: 'T', weight: 1 },
          { dimension: 'JP', side: 'P', weight: 3 },
        ],
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.mode).toBe('STANDARD');
    expect(res.body.data.scores.EI.winner).toBe('E');
    expect(res.body.data.mbti_type).toBe('ENTP');
  });

  it('POST /scoring/mbti computes AVG signals', async () => {
    const res = await request(app.getHttpServer())
      .post('/scoring/mbti')
      .send({
        mode: 'AVG',
        signals: [
          { dimension: 'EI', side: 'I', weight: 3 },
          { dimension: 'SN', side: 'S', weight: 2 },
          { dimension: 'TF', side: 'F', weight: 2 },
          { dimension: 'JP', side: 'J', weight: 1 },
        ],
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.mode).toBe('AVG');
    expect(res.body.data.mbti_type).toBe('ISFJ');
  });

  it('returns 400 for invalid weight', async () => {
    await request(app.getHttpServer())
      .post('/scoring/mbti')
      .send({
        mode: 'STANDARD',
        signals: [{ dimension: 'EI', side: 'E', weight: 4 }],
      })
      .expect(400);
  });
});
