/**
 * ProgressService 单元测试（revision、校验与分支行为）。
 */
import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { AssessmentMode } from '@prisma/client';
import { ProgressService } from './progress.service';
import { PrismaService } from '../prisma/prisma.service';
import type { PutProgressBodyDto } from './dto/put-progress-body.dto';

const validGuestBody: PutProgressBodyDto = {
  progress_data: {
    schema_version: 1,
    mode: 'STANDARD',
    standard: { current_index: 0, answers: {} },
  },
  if_match_revision: 0,
};

/** 回归：existing === null 时不得因 `existing?.userId !== null` 误抛403 */
describe('ProgressService.putForGuest', () => {
  it('会话不存在且 if_match_revision=0 时调用 create，不抛 ForbiddenException', async () => {
    const createMock = jest.fn().mockResolvedValue({
      id: '11111111-1111-1111-1111-111111111111',
      guestSessionId: 's-new',
      userId: null,
      mode: AssessmentMode.STANDARD,
      progressData: validGuestBody.progress_data,
      progressRevision: 1,
      updatedAt: new Date('2026-04-18T12:00:00.000Z'),
      expiresAt: new Date('2026-04-25T12:00:00.000Z'),
    });

    const prisma = {
      temporarySession: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: createMock,
        updateMany: jest.fn(),
      },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [ProgressService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    const service = moduleRef.get(ProgressService);
    const out = await service.putForGuest('s-new', AssessmentMode.STANDARD, { ...validGuestBody });

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(out.success).toBe(true);
    if (out.success) {
      expect(out.data.progress_revision).toBe(1);
      expect(out.data.session_id).toBe('s-new');
    }
  });

  it('会话已绑定 user_id 时抛 ForbiddenException', async () => {
    const prisma = {
      temporarySession: {
        findFirst: jest.fn().mockResolvedValue({
          id: '11111111-1111-1111-1111-111111111112',
          guestSessionId: 's1',
          userId: '00000000-0000-0000-0000-000000000001',
          mode: AssessmentMode.STANDARD,
          progressData: {},
          progressRevision: 1,
          updatedAt: new Date(),
          expiresAt: new Date(),
        }),
      },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [ProgressService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    const service = moduleRef.get(ProgressService);
    await expect(
      service.putForGuest('s1', AssessmentMode.STANDARD, validGuestBody),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('ProgressService.deleteForGuest', () => {
  it('会话已绑定 user_id 时抛 ForbiddenException', async () => {
    const deleteMock = jest.fn();
    const prisma = {
      temporarySession: {
        findFirst: jest.fn().mockResolvedValue({
          id: '11111111-1111-1111-1111-111111111113',
          guestSessionId: 's1',
          userId: '00000000-0000-0000-0000-000000000001',
          mode: AssessmentMode.STANDARD,
          progressData: {},
          progressRevision: 1,
          updatedAt: new Date(),
          expiresAt: new Date(),
        }),
        delete: deleteMock,
      },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [ProgressService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    const service = moduleRef.get(ProgressService);
    await expect(service.deleteForGuest('s1', AssessmentMode.STANDARD)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(deleteMock).not.toHaveBeenCalled();
  });
});
