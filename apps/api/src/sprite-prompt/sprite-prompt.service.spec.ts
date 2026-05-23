/**
 * 精灵文案服务单元测试（T4.7）。
 */
import { SpritePromptService } from './sprite-prompt.service';

describe('SpritePromptService', () => {
  it('getPublishedPrompts returns null when not published', async () => {
    const prisma = {
      spritePromptConfig: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new SpritePromptService(prisma as never);
    await expect(service.getPublishedPrompts()).resolves.toBeNull();
  });

  it('getPublishedPrompts returns hesitation and mutex lines', async () => {
    const prisma = {
      spritePromptConfig: {
        findFirst: jest.fn().mockResolvedValue({
          hesitationLines: ['line1'],
          mutexLines: { EI: ['mutex1'] },
        }),
      },
    };
    const service = new SpritePromptService(prisma as never);
    const result = await service.getPublishedPrompts();
    expect(result).toEqual({
      hesitationLines: ['line1'],
      mutexLines: { EI: ['mutex1'] },
    });
  });
});
