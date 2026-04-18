import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

/**
 * `GET/PUT /progress` 支持游客（无 Bearer + session_id）或注册用户（Bearer）。
 * OpenAPI 须为这两条 operation 声明 security，Swagger UI 才会把「Authorize」里的 JWT 打进请求；
 * 使用 `[{}, { 'access-token': [] }]`：满足其一即可（空对象 = 可不鉴权，PRD 游客路径）。
 */
function patchProgressOptionalBearer(document: OpenAPIObject): void {
  const progress = document.paths?.['/progress'];
  if (!progress) {
    return;
  }
  const optionalBearer: NonNullable<NonNullable<(typeof progress)['get']>['security']> = [
    {},
    { 'access-token': [] },
  ];
  for (const method of ['get', 'put'] as const) {
    const op = progress[method];
    if (op) {
      op.security = optionalBearer;
    }
  }
}

/** 与 `main.ts` 共用，保证集成测试与运行态 OpenAPI 一致 */
export function setupOpenApi(app: INestApplication): void {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('PPA API')
    .setDescription('性格星球：觉醒计划 — 后端 HTTP API（MVP，随迭代更新）')
    .setVersion('0.1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  patchProgressOptionalBearer(document);
  SwaggerModule.setup('docs', app, document);
}
