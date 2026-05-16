/**
 * 全局洞察看板 HTTP 接口：
 * - GET /dashboard/stats（公开）
 * - GET /dashboard/my-comparison（需 JWT）
 */
import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtUserService } from '../auth/jwt-user.service';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly jwtUser: JwtUserService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: '获取全局看板统计数据（公开）' })
  async getStats() {
    const data = await this.dashboardService.getStats();
    return { success: true, data, message: 'ok' };
  }

  @Get('my-comparison')
  @ApiOperation({ summary: '获取当前用户与全局数据的对比（需 JWT）' })
  async getMyComparison(@Headers('authorization') authorization?: string) {
    const userId = this.jwtUser.tryUserIdFromAuthHeader(authorization);
    if (!userId) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        message: 'unauthorized',
      });
    }
    const data = await this.dashboardService.getMyComparison(userId);
    if (!data) {
      return {
        success: true,
        data: null,
        message: 'no_test_result',
      };
    }
    return { success: true, data, message: 'ok' };
  }
}
