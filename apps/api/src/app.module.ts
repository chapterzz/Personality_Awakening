/**
 * API 根模块：注册 Prisma、认证、测评进度与看板等子模块。
 */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminAvgCmsModule } from './admin-avg-cms/admin-avg-cms.module';
import { AdminLibraryCmsModule } from './admin-library-cms/admin-library-cms.module';
import { AdminQuestionnaireModule } from './admin-questionnaire/admin-questionnaire.module';
import { AuthModule } from './auth/auth.module';
import { AvgScriptModule } from './avg-script/avg-script.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { LibraryModule } from './library/library.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProgressModule } from './progress/progress.module';
import { QuestionnaireModule } from './questionnaire/questionnaire.module';
import { ScoringModule } from './scoring/scoring.module';
import { SpritePromptModule } from './sprite-prompt/sprite-prompt.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProgressModule,
    ScoringModule,
    QuestionnaireModule,
    AdminQuestionnaireModule,
    AdminLibraryCmsModule,
    AvgScriptModule,
    SpritePromptModule,
    AdminAvgCmsModule,
    DashboardModule,
    LibraryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
