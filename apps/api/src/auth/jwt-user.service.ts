import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export type JwtAccessPayload = {
  sub: string;
  role?: string;
};

@Injectable()
export class JwtUserService {
  constructor(private readonly jwtService: JwtService) {}

  /** 从 `Authorization: Bearer …` 解析 `user_id`（JWT `sub`）；无效或缺失时返回 `null`。 */
  tryUserIdFromAuthHeader(authorization?: string): string | null {
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
      return payload.sub;
    } catch {
      return null;
    }
  }

  /** 集成测试 / T1.5 前本地联调用：签发与运行态相同算法的访问令牌。 */
  signAccessTokenForTests(userId: string, role = 'STUDENT'): string {
    return this.jwtService.sign({ sub: userId, role } satisfies JwtAccessPayload);
  }
}
