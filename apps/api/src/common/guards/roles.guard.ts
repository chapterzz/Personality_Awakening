/**
 * 角色守卫：在 JwtAuthGuard 之后校验 request.user.role 是否匹配 @Roles。
 */
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedRequest } from './jwt-auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = req.user?.role as UserRole | undefined;
    if (!role || !requiredRoles.includes(role)) {
      throw new ForbiddenException({
        success: false,
        data: null,
        message: 'forbidden',
      });
    }
    return true;
  }
}
