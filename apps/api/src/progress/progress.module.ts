/**
 * 进度模块：聚合 ProgressController 与 Jwt 依赖。
 */
import { Module } from '@nestjs/common';
import { JwtUserModule } from '../auth/jwt-user.module';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
  imports: [JwtUserModule],
  controllers: [ProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}
