/**
 * App 模块 HTTP 集成测试：根路径、健康检查、Swagger 与 OpenAPI JSON。
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupOpenApi } from '../src/openapi.setup';

describe('AppModule (HTTP 集成)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupOpenApi(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET / 返回占位文案', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });

  it('GET /health 返回 JSON 健康负载', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', service: 'ppa-api' });
  });

  it('GET /docs 暴露 Swagger UI', async () => {
    const res = await request(app.getHttpServer()).get('/docs').expect(200);
    expect(res.text).toContain('swagger');
  });

  it('GET /docs-json 返回 OpenAPI 文档', async () => {
    const res = await request(app.getHttpServer()).get('/docs-json').expect(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(res.body.info.title).toBe('PPA API');
    expect(res.body.paths['/health']).toBeDefined();
    expect(res.body.paths['/progress']).toBeDefined();
  });
});
