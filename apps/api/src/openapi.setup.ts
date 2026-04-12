import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** 与 `main.ts` 共用，保证集成测试与运行态 OpenAPI 一致 */
export function setupOpenApi(app: INestApplication): void {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('PPA API')
    .setDescription('性格星球：觉醒计划 — 后端 HTTP API（MVP，随迭代更新）')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
}
