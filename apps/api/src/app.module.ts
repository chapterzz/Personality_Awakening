import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProgressModule } from './progress/progress.module';

@Module({
  imports: [PrismaModule, ProgressModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
