/**
 * 全局洞察看板服务：聚合 TestResult 数据，返回类型分布、精灵热力图和趣味统计。
 * 精灵映射规则与前端 sprite-profile-card.tsx 一致：E→曦光领航精灵，I→月影探索精灵。
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** 精灵映射：MBTI 首字母 → 精灵名称 */
function pickSpriteLabel(mbtiType: string): string {
  const first = mbtiType.toUpperCase()[0];
  if (first === 'E') return '曦光领航精灵';
  if (first === 'I') return '月影探索精灵';
  return '星环守护精灵';
}

/** 16 种 MBTI 类型 */
const ALL_MBTI_TYPES = [
  'INTJ',
  'INTP',
  'ENTJ',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISFJ',
  'ESTJ',
  'ESFJ',
  'ISTP',
  'ISFP',
  'ESTP',
  'ESFP',
];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /** 获取全局看板统计数据 */
  async getStats() {
    // 按 MBTI 类型分组统计人数
    const typeGroups = await this.prisma.testResult.groupBy({
      by: ['mbtiType'],
      _count: { id: true },
    });

    // 构建类型→人数映射，补全 0 人数的类型
    const typeCountMap = new Map<string, number>();
    for (const g of typeGroups) {
      typeCountMap.set(g.mbtiType, g._count.id);
    }

    const totalUsers = typeGroups.reduce((sum, g) => sum + g._count.id, 0);

    // 类型分布（按人数降序）
    const typeDistribution = ALL_MBTI_TYPES.map((t) => ({
      type: t,
      count: typeCountMap.get(t) ?? 0,
    })).sort((a, b) => b.count - a.count);

    // 精灵热力图矩阵：类型 × 精灵
    const spriteHeatmap: Array<{ type: string; sprite: string; count: number }> = [];
    for (const t of ALL_MBTI_TYPES) {
      const count = typeCountMap.get(t) ?? 0;
      if (count > 0) {
        spriteHeatmap.push({ type: t, sprite: pickSpriteLabel(t), count });
      }
    }

    // 趣味数据
    const sortedByCount = [...typeDistribution].sort((a, b) => b.count - a.count);
    const mostCommon = sortedByCount[0];
    const rarest =
      [...sortedByCount].reverse().find((t) => t.count > 0) ??
      sortedByCount[sortedByCount.length - 1];

    // 精灵统计
    const spriteCount = new Map<string, number>();
    for (const g of typeGroups) {
      const sprite = pickSpriteLabel(g.mbtiType);
      spriteCount.set(sprite, (spriteCount.get(sprite) ?? 0) + g._count.id);
    }
    const mostPopularSprite = [...spriteCount.entries()].sort((a, b) => b[1] - a[1])[0];

    // 维度平衡度：统计各维度侧的人数
    const dimensionBalance: Record<string, number> = {
      E: 0,
      I: 0,
      S: 0,
      N: 0,
      T: 0,
      F: 0,
      J: 0,
      P: 0,
    };
    for (const g of typeGroups) {
      const type = g.mbtiType.toUpperCase();
      const count = g._count.id;
      if (type[0] === 'E') dimensionBalance.E += count;
      else dimensionBalance.I += count;
      if (type[1] === 'S') dimensionBalance.S += count;
      else dimensionBalance.N += count;
      if (type[2] === 'T') dimensionBalance.T += count;
      else dimensionBalance.F += count;
      if (type[3] === 'J') dimensionBalance.J += count;
      else dimensionBalance.P += count;
    }

    return {
      totalUsers,
      typeDistribution,
      spriteHeatmap,
      funInsights: {
        mostCommonType: {
          type: mostCommon.type,
          count: mostCommon.count,
          percentage: totalUsers > 0 ? Math.round((mostCommon.count / totalUsers) * 1000) / 10 : 0,
        },
        rarestType: {
          type: rarest.type,
          count: rarest.count,
          percentage: totalUsers > 0 ? Math.round((rarest.count / totalUsers) * 1000) / 10 : 0,
        },
        mostPopularSprite: mostPopularSprite
          ? { sprite: mostPopularSprite[0], count: mostPopularSprite[1] }
          : { sprite: '暂无数据', count: 0 },
        dimensionBalance,
      },
    };
  }

  /** 获取当前用户的人格类型与全局对比 */
  async getMyComparison(userId: string) {
    // 查找用户最近一次测评结果
    const result = await this.prisma.testResult.findFirst({
      where: { userId },
      orderBy: { completedAt: 'desc' },
    });

    if (!result) {
      return null;
    }

    // 统计同类型人数
    const sameTypeCount = await this.prisma.testResult.count({
      where: { mbtiType: result.mbtiType },
    });

    // 总人数
    const totalUsers = await this.prisma.testResult.count();

    // 该类型的排名（按人数降序）
    const allTypes = await this.prisma.testResult.groupBy({
      by: ['mbtiType'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    const rank = allTypes.findIndex((t) => t.mbtiType === result.mbtiType) + 1;

    return {
      myType: result.mbtiType,
      typePercentage: totalUsers > 0 ? Math.round((sameTypeCount / totalUsers) * 1000) / 10 : 0,
      typeRank: rank,
    };
  }
}
