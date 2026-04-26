/**
 * API 根模块：注册 Prisma、认证与测评进度等子模块。
 */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProgressModule } from './progress/progress.module';
import { ScoringModule } from './scoring/scoring.module';

@Module({
  imports: [PrismaModule, AuthModule, ProgressModule, ScoringModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
