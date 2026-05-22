/**
 * JWT 认证守卫：解析 Bearer 令牌并将 userId/role 写入 request.user。
 */
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { JwtUserService } from '../../auth/jwt-user.service';

export type AuthenticatedUser = {
  userId: string;
  role: string;
};

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtUser: JwtUserService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const payload = this.jwtUser.tryPayloadFromAuthHeader(req.headers.authorization);
    if (!payload) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        message: 'invalid_token',
      });
    }
    (req as AuthenticatedRequest).user = {
      userId: payload.sub,
      role: payload.role,
    };
    return true;
  }
}
