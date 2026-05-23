/**
 * Admin 科普图书馆 CMS 模块（T4.8）。
 */
import { Module } from '@nestjs/common';
import { JwtUserModule } from '../auth/jwt-user.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminLibraryCmsController } from './admin-library-cms.controller';
import { AdminLibraryCmsService } from './admin-library-cms.service';

@Module({
  imports: [JwtUserModule],
  controllers: [AdminLibraryCmsController],
  providers: [AdminLibraryCmsService, JwtAuthGuard, RolesGuard],
})
export class AdminLibraryCmsModule {}
