/**
 * DashboardService 单元测试：验证聚合逻辑、精灵映射和边界情况。
 */
import { DashboardService } from './dashboard.service';

/** 构造 Mock PrismaService，覆盖 groupBy / count / findFirst */
function createMockPrisma(groupByResult: Array<{ mbtiType: string; _count: { id: number } }>) {
  return {
    testResult: {
      groupBy: jest.fn().mockResolvedValue(groupByResult),
      count: jest
        .fn()
        .mockImplementation((args?: { where?: { mbtiType?: string; userId?: string } }) => {
          if (args?.where?.mbtiType) {
            const found = groupByResult.find((g) => g.mbtiType === args.where!.mbtiType);
            return Promise.resolve(found?._count.id ?? 0);
          }
          return Promise.resolve(groupByResult.reduce((s, g) => s + g._count.id, 0));
        }),
      findFirst: jest.fn().mockImplementation(({ where }: { where?: { userId?: string } }) => {
        if (where?.userId === 'user-1') {
          return Promise.resolve({
            id: 'result-1',
            userId: 'user-1',
            mbtiType: 'INFP',
            mode: 'STANDARD',
            scores: {},
            completedAt: new Date(),
          });
        }
        return Promise.resolve(null);
      }),
    },
  } as never;
}

describe('DashboardService', () => {
  describe('getStats', () => {
    it('返回正确的类型分布和精灵热力图', async () => {
      const mockData = [
        { mbtiType: 'INFP', _count: { id: 10 } },
        { mbtiType: 'ENFP', _count: { id: 8 } },
        { mbtiType: 'ISTJ', _count: { id: 3 } },
      ];
      const prisma = createMockPrisma(mockData);
      const service = new DashboardService(prisma);

      const stats = await service.getStats();

      expect(stats.totalUsers).toBe(21);
      expect(stats.typeDistribution).toHaveLength(16);
      expect(stats.typeDistribution[0]).toEqual({ type: 'INFP', count: 10 });
      // 精灵热力图只包含有数据的类型
      expect(stats.spriteHeatmap).toHaveLength(3);
      expect(stats.spriteHeatmap.find((h) => h.type === 'INFP')?.sprite).toBe('月影探索精灵');
      expect(stats.spriteHeatmap.find((h) => h.type === 'ENFP')?.sprite).toBe('曦光领航精灵');
    });

    it('空数据时返回全零统计', async () => {
      const prisma = createMockPrisma([]);
      const service = new DashboardService(prisma);

      const stats = await service.getStats();

      expect(stats.totalUsers).toBe(0);
      expect(stats.typeDistribution).toHaveLength(16);
      expect(stats.typeDistribution.every((t) => t.count === 0)).toBe(true);
      expect(stats.funInsights.mostCommonType.count).toBe(0);
    });

    it('趣味数据中的维度平衡度计算正确', async () => {
      const mockData = [
        { mbtiType: 'INFP', _count: { id: 5 } }, // I, N, F, P
        { mbtiType: 'ESTJ', _count: { id: 3 } }, // E, S, T, J
      ];
      const prisma = createMockPrisma(mockData);
      const service = new DashboardService(prisma);

      const stats = await service.getStats();
      const balance = stats.funInsights.dimensionBalance;

      expect(balance.E).toBe(3);
      expect(balance.I).toBe(5);
      expect(balance.S).toBe(3);
      expect(balance.N).toBe(5);
      expect(balance.T).toBe(3);
      expect(balance.F).toBe(5);
      expect(balance.J).toBe(3);
      expect(balance.P).toBe(5);
    });
  });

  describe('getMyComparison', () => {
    it('返回用户类型与全局对比', async () => {
      const mockData = [
        { mbtiType: 'INFP', _count: { id: 10 } },
        { mbtiType: 'ENFP', _count: { id: 8 } },
      ];
      const prisma = createMockPrisma(mockData);
      const service = new DashboardService(prisma);

      const result = await service.getMyComparison('user-1');

      expect(result).not.toBeNull();
      expect(result!.myType).toBe('INFP');
      expect(result!.typeRank).toBe(1);
    });

    it('用户无测评结果时返回 null', async () => {
      const prisma = createMockPrisma([]);
      const service = new DashboardService(prisma);

      const result = await service.getMyComparison('no-result-user');

      expect(result).toBeNull();
    });
  });
});
