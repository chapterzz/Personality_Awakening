/**
 * 角色元数据装饰器：标记路由所需 UserRole（T4.5-MVP / T4.6）。
 */
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** 声明仅指定角色可访问该路由 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
