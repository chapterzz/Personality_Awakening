/**
 * 认证模块：注册/登录与 JWT 签发依赖。
 */
import { Module } from '@nestjs/common';
import { JwtUserModule } from './jwt-user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [JwtUserModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
