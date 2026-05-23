/**
 * AVG 脚本服务单元测试（T4.7）。
 */
import { AvgScriptService } from './avg-script.service';

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

  it('getPublishedScript assembles script_id from row id', async () => {
    const prisma = {
      avgScript: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'demo-avg-v1',
          nodesJson: {
            start_node_id: 'intro',
            backgrounds: { night: 'gradient' },
            nodes: { intro: { kind: 'end', background_key: 'night', lines: [] } },
          },
        }),
      },
    };
    const service = new AvgScriptService(prisma as never);
    const result = await service.getPublishedScript('demo-avg-v1');
    expect(result).toMatchObject({
      script_id: 'demo-avg-v1',
      start_node_id: 'intro',
    });
  });
});
