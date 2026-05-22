/**
 * 从 Bearer 解析 `user_id`（`sub`）与校验载荷；签发含 `role` 的访问令牌。
 */
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export type JwtAccessPayload = {
  /** user_id（JWT 标准 `sub`） */
  sub: string;
  /** `STUDENT` | `ADMIN` */
  role: string;
};

@Injectable()
export class JwtUserService {
  constructor(private readonly jwtService: JwtService) {}

  /** 从 Bearer 解析 JWT 载荷；无效或缺失时返回 `null`。 */
  tryPayloadFromAuthHeader(authorization?: string): JwtAccessPayload | null {
    if (!authorization || !authorization.toLowerCase().startsWith('bearer ')) {
      return null;
    }
    const token = authorization.slice(7).trim();
    if (!token) {
      return null;
    }
    try {
      const payload = this.jwtService.verify<JwtAccessPayload>(token);
      if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
        return null;
      }
      if (typeof payload.role !== 'string' || payload.role.length === 0) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  /** 从 `Authorization: Bearer …` 解析 `user_id`（JWT `sub`）；无效或缺失时返回 `null`。 */
  tryUserIdFromAuthHeader(authorization?: string): string | null {
    return this.tryPayloadFromAuthHeader(authorization)?.sub ?? null;
  }

  /** 签发访问令牌：载荷含 `sub`（user_id）与 `role`（PRD §2.3）。 */
  signAccessToken(userId: string, role: string): string {
    return this.jwtService.sign({ sub: userId, role } satisfies JwtAccessPayload);
  }

  /** 集成测试：与 `signAccessToken` 算法一致。 */
  signAccessTokenForTests(userId: string, role = 'STUDENT'): string {
    return this.signAccessToken(userId, role);
  }
}
