/**
 * 注册 JwtModule（全局）与 JwtUserService，供进度与认证复用。
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtUserService } from './jwt-user.service';

const secret = process.env.JWT_SECRET ?? 'ppa-dev-jwt-secret-change-in-production';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [JwtUserService],
  exports: [JwtUserService],
})
export class JwtUserModule {}
