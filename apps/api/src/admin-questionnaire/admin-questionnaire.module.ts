/**
 * Admin 题库 CMS 模块（T4.6）。
 */
import { Module } from '@nestjs/common';
import { JwtUserModule } from '../auth/jwt-user.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminQuestionnaireController } from './admin-questionnaire.controller';
import { AdminQuestionnaireService } from './admin-questionnaire.service';

@Module({
  imports: [JwtUserModule],
  controllers: [AdminQuestionnaireController],
  providers: [AdminQuestionnaireService, JwtAuthGuard, RolesGuard],
})
export class AdminQuestionnaireModule {}
