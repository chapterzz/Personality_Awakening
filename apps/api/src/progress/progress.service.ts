/**
 * 进行中测评进度业务：游客/注册用户读写 `TemporarySession`、乐观锁 revision（PRD §2.5）。
 */
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PutProgressBodyDto } from './dto/put-progress-body.dto';
import { assertValidProgressData, ProgressDataValidationError } from './validate-progress-data';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function nextExpiresAt(): Date {
  return new Date(Date.now() + SESSION_TTL_MS);
}

export type ProgressSnapshotDto = {
  session_id: string;
  user_id: string | null;
  progress_data: unknown;
  progress_revision: number;
  updated_at: string;
  expires_at: string;
};

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  private toSnapshot(row: {
    sessionId: string;
    userId: string | null;
    progressData: unknown;
    progressRevision: number;
    updatedAt: Date;
    expiresAt: Date;
  }): ProgressSnapshotDto {
    return {
      session_id: row.sessionId,
      user_id: row.userId,
      progress_data: row.progressData,
      progress_revision: row.progressRevision,
      updated_at: row.updatedAt.toISOString(),
      expires_at: row.expiresAt.toISOString(),
    };
  }

  private ok<T>(data: T) {
    return { success: true as const, data, message: null as null };
  }

  private revisionConflict(row: {
    progressData: unknown;
    progressRevision: number;
    updatedAt: Date;
  }): never {
    throw new HttpException(
      {
        success: false,
        data: {
          progress_data: row.progressData,
          progress_revision: row.progressRevision,
          updated_at: row.updatedAt.toISOString(),
        },
        message: 'progress_revision_conflict',
      },
      HttpStatus.CONFLICT,
    );
  }

  private validatePayload(progressData: unknown): Prisma.InputJsonValue {
    try {
      return assertValidProgressData(progressData) as Prisma.InputJsonValue;
    } catch (e) {
      if (e instanceof ProgressDataValidationError) {
        throw new BadRequestException({
          success: false,
          data: null,
          message: e.message,
        });
      }
      throw e;
    }
  }

  async getForGuest(sessionId: string) {
    const row = await this.prisma.temporarySession.findUnique({ where: { sessionId } });
    if (!row) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'progress_not_found',
      });
    }
    if (row.userId !== null) {
      throw new ForbiddenException({
        success: false,
        data: null,
        message: 'session_requires_login',
      });
    }
    return this.ok(this.toSnapshot(row));
  }

  async getForUser(userId: string) {
    const row = await this.prisma.temporarySession.findUnique({ where: { userId } });
    if (!row) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'progress_not_found',
      });
    }
    return this.ok(this.toSnapshot(row));
  }

  async putForGuest(sessionId: string, body: PutProgressBodyDto) {
    const progressPayload = this.validatePayload(body.progress_data);
    const expiresAt = nextExpiresAt();

    const existing = await this.prisma.temporarySession.findUnique({ where: { sessionId } });

    if (existing && existing.userId !== null) {
      throw new ForbiddenException({
        success: false,
        data: null,
        message: 'session_requires_login',
      });
    }

    if (!existing) {
      if (body.if_match_revision !== 0) {
        throw new BadRequestException({
          success: false,
          data: null,
          message: 'if_match_revision must be 0 when creating a guest session',
        });
      }
      try {
        const created = await this.prisma.temporarySession.create({
          data: {
            sessionId,
            userId: null,
            progressData: progressPayload,
            progressRevision: 1,
            expiresAt,
          },
        });
        return this.ok(this.toSnapshot(created));
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          const row = await this.prisma.temporarySession.findUnique({ where: { sessionId } });
          if (row) {
            this.revisionConflict(row);
          }
        }
        throw e;
      }
    }

    const updated = await this.prisma.temporarySession.updateMany({
      where: {
        sessionId,
        userId: null,
        progressRevision: body.if_match_revision,
      },
      data: {
        progressData: progressPayload,
        progressRevision: { increment: 1 },
        expiresAt,
      },
    });

    if (updated.count === 1) {
      const row = await this.prisma.temporarySession.findUniqueOrThrow({ where: { sessionId } });
      return this.ok(this.toSnapshot(row));
    }

    const row = await this.prisma.temporarySession.findUnique({ where: { sessionId } });
    if (!row) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'progress_not_found',
      });
    }
    this.revisionConflict(row);
  }

  async putForUser(userId: string, body: PutProgressBodyDto) {
    const progressPayload = this.validatePayload(body.progress_data);
    const expiresAt = nextExpiresAt();

    const existing = await this.prisma.temporarySession.findUnique({ where: { userId } });

    if (!existing) {
      if (body.if_match_revision !== 0) {
        throw new BadRequestException({
          success: false,
          data: null,
          message: 'if_match_revision must be 0 when creating a user session',
        });
      }
      try {
        const created = await this.prisma.temporarySession.create({
          data: {
            sessionId: randomUUID(),
            userId,
            progressData: progressPayload,
            progressRevision: 1,
            expiresAt,
          },
        });
        return this.ok(this.toSnapshot(created));
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          const row = await this.prisma.temporarySession.findUnique({ where: { userId } });
          if (row) {
            this.revisionConflict(row);
          }
        }
        throw e;
      }
    }

    const updated = await this.prisma.temporarySession.updateMany({
      where: {
        userId,
        progressRevision: body.if_match_revision,
      },
      data: {
        progressData: progressPayload,
        progressRevision: { increment: 1 },
        expiresAt,
      },
    });

    if (updated.count === 1) {
      const row = await this.prisma.temporarySession.findUniqueOrThrow({ where: { userId } });
      return this.ok(this.toSnapshot(row));
    }

    const fresh = await this.prisma.temporarySession.findUnique({ where: { userId } });
    if (!fresh) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'progress_not_found',
      });
    }
    this.revisionConflict(fresh);
  }

  /** 删除进行中会话行；游客仅能删 `user_id` 为空的记录（与 GET 权限一致）。 */
  async deleteForGuest(sessionId: string) {
    const row = await this.prisma.temporarySession.findUnique({ where: { sessionId } });
    if (!row) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'progress_not_found',
      });
    }
    if (row.userId !== null) {
      throw new ForbiddenException({
        success: false,
        data: null,
        message: 'session_requires_login',
      });
    }
    await this.prisma.temporarySession.delete({ where: { sessionId } });
    return this.ok(null);
  }

  async deleteForUser(userId: string) {
    const row = await this.prisma.temporarySession.findUnique({ where: { userId } });
    if (!row) {
      throw new NotFoundException({
        success: false,
        data: null,
        message: 'progress_not_found',
      });
    }
    await this.prisma.temporarySession.delete({ where: { userId } });
    return this.ok(null);
  }
}
