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
