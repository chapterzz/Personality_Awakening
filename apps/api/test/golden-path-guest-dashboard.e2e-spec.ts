/**
 * Golden Path Tier 1：Guest 访问看板公开 API（T5.2 / T3.1）。
 */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupOpenApi } from '../src/openapi.setup';

jest.setTimeout(30_000);

describe('Golden Path — Guest Dashboard API (T5.2)', () => {
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

  it('GET /dashboard/stats：无 JWT 仍 200 且 16 型结构', async () => {
    const res = await request(app.getHttpServer()).get('/dashboard/stats').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.typeDistribution).toHaveLength(16);
  });

  it('GET /dashboard/my-comparison：无 Authorization → 401', async () => {
    await request(app.getHttpServer()).get('/dashboard/my-comparison').expect(401);
  });
});
