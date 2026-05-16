/**
 * API 根模块：注册 Prisma、认证、测评进度与看板等子模块。
 */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProgressModule } from './progress/progress.module';
import { QuestionnaireModule } from './questionnaire/questionnaire.module';
import { ScoringModule } from './scoring/scoring.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProgressModule,
    ScoringModule,
    QuestionnaireModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
