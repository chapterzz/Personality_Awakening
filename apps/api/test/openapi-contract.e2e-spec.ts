/**
 * OpenAPI `/docs-json` 契约快照测试（progress security、参数声明等）。
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupOpenApi } from '../src/openapi.setup';

/**
 * OpenAPI 与实现对齐（TECH_SPEC §5.2 契约/文档）。
 * 人工验收中曾出现：operation 未挂 security → Swagger 不注入 Bearer；
 * @Headers('authorization') → UI 误将 authorization 标为必填。此处用文档快照防回归。
 */
describe('OpenAPI 契约', () => {
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

  it('GET /docs-json 可解析且含 progress', async () => {
    const res = await request(app.getHttpServer()).get('/docs-json').expect(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(res.body.paths['/progress']).toBeDefined();
  });

  it('GET/PUT /progress 使用可选 Bearer（security 为 {} 与 access-token 二选一）', async () => {
    const res = await request(app.getHttpServer()).get('/docs-json').expect(200);
    expect(res.body.paths['/progress'].get.security).toEqual([{}, { 'access-token': [] }]);
    expect(res.body.paths['/progress'].put.security).toEqual([{}, { 'access-token': [] }]);
  });

  it('components.securitySchemes 注册 access-token（Authorize 对话框）', async () => {
    const res = await request(app.getHttpServer()).get('/docs-json').expect(200);
    expect(res.body.components?.securitySchemes?.['access-token']).toMatchObject({
      type: 'http',
      scheme: 'bearer',
    });
  });

  it('PUT /progress 声明 requestBody 且勿将 authorization 暴露为 Parameters 中的 header', async () => {
    const res = await request(app.getHttpServer()).get('/docs-json').expect(200);
    const putOp = res.body.paths['/progress'].put;
    expect(putOp.requestBody).toBeDefined();
    expect(putOp.requestBody.required).toBe(true);

    for (const method of ['get', 'put'] as const) {
      const op = res.body.paths['/progress'][method];
      const params = op.parameters ?? [];
      const authHeaderParams = params.filter(
        (p: { in?: string; name?: string }) =>
          p.in === 'header' && String(p.name).toLowerCase() === 'authorization',
      );
      expect(authHeaderParams).toEqual([]);
    }
  });

  it('session_id 为 query 参数且非 path 级必填（由运行时 guest/JWT 二选一校验）', async () => {
    const res = await request(app.getHttpServer()).get('/docs-json').expect(200);
    for (const method of ['get', 'put'] as const) {
      const op = res.body.paths['/progress'][method];
      const sessionParam = (op.parameters ?? []).find(
        (p: { name?: string; in?: string }) => p.name === 'session_id' && p.in === 'query',
      );
      expect(sessionParam).toBeDefined();
      expect(sessionParam.required).toBe(false);
    }
  });
});
