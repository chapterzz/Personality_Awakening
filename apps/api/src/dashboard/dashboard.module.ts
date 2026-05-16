/**
 * 全局洞察看板模块：聚合 TestResult 数据，提供公开统计 API。
 */
import { Module } from '@nestjs/common';
import { JwtUserModule } from '../auth/jwt-user.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [JwtUserModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
