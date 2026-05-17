/**
 * 科普图书馆模块：公开只读 API，供学生端 /library 消费（T4.1）。
 */
import { Module } from '@nestjs/common';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';

@Module({
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [LibraryService],
})
export class LibraryModule {}
