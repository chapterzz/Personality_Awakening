/**
 * AVG 脚本服务单元测试（T4.7）。
 */
import { AvgScriptService } from './avg-script.service';

const sampleRow = {
  id: 'demo-avg-v1',
  title: '星港夜话',
  nodesJson: {
    start_node_id: 'intro',
    backgrounds: { night: 'gradient' },
    nodes: { intro: { kind: 'end', background_key: 'night', lines: [] } },
  },
};

describe('AvgScriptService', () => {
  it('getPublishedScript returns null when not published', async () => {
    const prisma = {
      avgScript: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new AvgScriptService(prisma as never);
    await expect(service.getPublishedScript('demo-avg-v1')).resolves.toBeNull();
  });

  it('getPublishedScript assembles script_id and title from row', async () => {
    const prisma = {
      avgScript: {
        findFirst: jest.fn().mockResolvedValue(sampleRow),
      },
    };
    const service = new AvgScriptService(prisma as never);
    const result = await service.getPublishedScript('demo-avg-v1');
    expect(result).toMatchObject({
      script_id: 'demo-avg-v1',
      title: '星港夜话',
      start_node_id: 'intro',
    });
  });

  it('getActivePublishedScript returns most recently published row', async () => {
    const prisma = {
      avgScript: {
        findFirst: jest.fn().mockResolvedValue({
          ...sampleRow,
          id: 'hp-chamber-of-secrets-48',
          title: '哈利波特',
        }),
      },
    };
    const service = new AvgScriptService(prisma as never);
    const result = await service.getActivePublishedScript();
    expect(result).toMatchObject({
      script_id: 'hp-chamber-of-secrets-48',
      title: '哈利波特',
    });
    expect(prisma.avgScript.findFirst).toHaveBeenCalledWith({
      where: { isPublished: true },
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    });
  });
});
