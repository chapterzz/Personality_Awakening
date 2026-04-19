/**
 * NestJS HTTP 应用入口：全局校验管道、OpenAPI、监听端口（默认 3001）。
 */
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupOpenApi } from './openapi.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3001);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  setupOpenApi(app);

  await app.listen(port);
}
bootstrap();
