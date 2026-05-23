/**
 * AVG 脚本公开消费模块（T4.7）。
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AvgScriptController } from './avg-script.controller';
import { AvgScriptService } from './avg-script.service';

@Module({
  imports: [PrismaModule],
  controllers: [AvgScriptController],
  providers: [AvgScriptService],
  exports: [AvgScriptService],
})
export class AvgScriptModule {}
