/**
 * 趣味数据卡片单测：维度条比例、副文案格式化与组件渲染（T3.4）。
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  FunInsightCards,
  computeDimensionBarPercent,
  formatInsightDetail,
} from '@/components/dashboard/fun-insight-cards';

const mockInsights = {
  mostCommonType: { type: 'INFP', count: 18, percentage: 14.1 },
  rarestType: { type: 'ESTJ', count: 2, percentage: 1.6 },
  mostPopularSprite: { sprite: '月影探索精灵', count: 72 },
  dimensionBalance: { E: 45, I: 55, S: 40, N: 60, T: 48, F: 52, J: 42, P: 58 },
};

describe('computeDimensionBarPercent', () => {
  it('按左右人数比例返回百分比', () => {
    expect(computeDimensionBarPercent(3, 7)).toBe(30);
    expect(computeDimensionBarPercent(5, 0)).toBe(100);
  });

  it('总数为 0 时返回 50', () => {
    expect(computeDimensionBarPercent(0, 0)).toBe(50);
  });
});

describe('formatInsightDetail', () => {
  it('有数据时含人数与百分比', () => {
    expect(formatInsightDetail(18, 14.1)).toBe('18 人（14.1%）');
  });

  it('无数据时返回固定文案', () => {
    expect(formatInsightDetail(0, 0)).toBe('暂无测评数据');
  });
});

describe('FunInsightCards', () => {
  it('渲染四张卡片标题', () => {
    render(<FunInsightCards insights={mockInsights} />);
    expect(screen.getByText('趣味数据')).toBeInTheDocument();
    expect(screen.getByText('最多人的类型')).toBeInTheDocument();
    expect(screen.getByText('最少人的类型')).toBeInTheDocument();
    expect(screen.getByText('最受欢迎精灵')).toBeInTheDocument();
    expect(screen.getByText('维度平衡')).toBeInTheDocument();
  });

  it('展示 API 下发的类型与精灵名', () => {
    render(<FunInsightCards insights={mockInsights} />);
    expect(screen.getByText('INFP')).toBeInTheDocument();
    expect(screen.getByText(/月影探索精灵/)).toBeInTheDocument();
    expect(screen.getByText('18 人（14.1%）')).toBeInTheDocument();
  });

  it('count 为 0 时副文案为暂无测评数据', () => {
    render(
      <FunInsightCards
        insights={{
          ...mockInsights,
          mostCommonType: { type: 'INTJ', count: 0, percentage: 0 },
        }}
      />,
    );
    expect(screen.getByText('暂无测评数据')).toBeInTheDocument();
  });
});
