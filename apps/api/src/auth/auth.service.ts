/**
 * 注册、登录与游客会话转化（绑定 `TemporarySession` 或同事务提交 `TestResult`）。
 */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUserService } from './jwt-user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { hashPassword, verifyPassword } from './password-crypto';

export type AuthSuccessBody = {
  success: true;
  data: {
    access_token: string;
    token_type: 'Bearer';
    user: { user_id: string; nickname: string; role: UserRole };
  };
  message: null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtUser: JwtUserService,
  ) {}

  private ok(data: AuthSuccessBody['data']): AuthSuccessBody {
    return { success: true, data, message: null };
  }

  private buildAuthPayload(user: Pick<User, 'id' | 'nickname' | 'role'>): AuthSuccessBody['data'] {
    const access_token = this.jwtUser.signAccessToken(user.id, user.role);
    return {
      access_token,
      token_type: 'Bearer',
      user: { user_id: user.id, nickname: user.nickname, role: user.role },
    };
  }

  async register(dto: RegisterDto): Promise<AuthSuccessBody> {
    if (dto.finalize_submission) {
      if (!dto.guest_session_id?.trim()) {
        throw new BadRequestException({
          success: false,
          data: null,
          message: 'guest_session_id_required_when_finalize',
        });
      }
      if (!dto.submission) {
        throw new BadRequestException({
          success: false,
          data: null,
          message: 'submission_required_when_finalize',
        });
      }
    }

    const passwordHash = await hashPassword(dto.password);

    if (!dto.guest_session_id?.trim()) {
      try {
        const user = await this.prisma.user.create({
          data: {
            nickname: dto.nickname,
            passwordHash,
            role: UserRole.STUDENT,
          },
        });
        return this.ok(this.buildAuthPayload(user));
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          throw new ConflictException({
            success: false,
            data: null,
            message: 'nickname_taken',
          });
        }
        throw e;
      }
    }

    const sessionId = dto.guest_session_id.trim();

    return this.prisma.$transaction(async (tx) => {
      const guestRows = await tx.temporarySession.findMany({
        where: { guestSessionId: sessionId },
      });
      if (guestRows.length === 0) {
        throw new NotFoundException({
          success: false,
          data: null,
          message: 'guest_session_not_found',
        });
      }
      if (guestRows.some((row) => row.userId !== null)) {
        throw new BadRequestException({
          success: false,
          data: null,
          message: 'guest_session_already_bound',
        });
      }

      let user: User;
      try {
        user = await tx.user.create({
          data: {
            nickname: dto.nickname,
            passwordHash,
            role: UserRole.STUDENT,
          },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          throw new ConflictException({
            success: false,
            data: null,
            message: 'nickname_taken',
          });
        }
        throw e;
      }

      if (dto.finalize_submission && dto.submission) {
        const mode = dto.submission.mode;
        await tx.testResult.create({
          data: {
            userId: user.id,
            mode,
            scores: dto.submission.scores as Prisma.InputJsonValue,
            mbtiType: dto.submission.mbti_type,
            completedAt: new Date(),
          },
        });
        await tx.temporarySession.deleteMany({ where: { guestSessionId: sessionId, mode } });
      } else {
        await tx.temporarySession.updateMany({
          where: { guestSessionId: sessionId },
          data: { userId: user.id },
        });
      }

      return this.ok(this.buildAuthPayload(user));
    });
  }

  async login(dto: LoginDto): Promise<AuthSuccessBody> {
    const user = await this.prisma.user.findUnique({
      where: { nickname: dto.nickname },
    });
    if (!user || user.isDeleted) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        message: 'invalid_credentials',
      });
    }
    const ok = await verifyPassword(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        message: 'invalid_credentials',
      });
    }
    return this.ok(this.buildAuthPayload(user));
  }
}
