/**
 * Admin AVG / 精灵文案 CMS 模块（T4.7）。
 */
import { Module } from '@nestjs/common';
import { JwtUserModule } from '../auth/jwt-user.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminAvgCmsController } from './admin-avg-cms.controller';
import { AdminAvgCmsService } from './admin-avg-cms.service';

@Module({
  imports: [JwtUserModule],
  controllers: [AdminAvgCmsController],
  providers: [AdminAvgCmsService, JwtAuthGuard, RolesGuard],
})
export class AdminAvgCmsModule {}
