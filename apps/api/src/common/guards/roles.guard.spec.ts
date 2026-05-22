/**
 * RolesGuard 单元测试：STUDENT 角色应被拒绝访问 ADMIN 路由。
 */
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';
import type { AuthenticatedRequest } from './jwt-auth.guard';

function mockContext(role: string | undefined): ExecutionContext {
  const req = { user: role ? { userId: 'u1', role } : undefined } as AuthenticatedRequest;
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new RolesGuard(reflector);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows ADMIN when @Roles(ADMIN) is set', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.ADMIN]);
    expect(guard.canActivate(mockContext('ADMIN'))).toBe(true);
  });

  it('rejects STUDENT for @Roles(ADMIN)', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.ADMIN]);
    expect(() => guard.canActivate(mockContext('STUDENT'))).toThrow(ForbiddenException);
  });

  it('passes through when no roles metadata', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    expect(guard.canActivate(mockContext(undefined))).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, expect.any(Array));
  });
});
