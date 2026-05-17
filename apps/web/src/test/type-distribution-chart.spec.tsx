/**
 * 看板类型分布柱状图单测：柱条配色逻辑与组件渲染。
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  TypeDistributionChart,
  resolveTypeBarFill,
} from '@/components/dashboard/type-distribution-chart';

const sampleData = [
  { type: 'INFP', count: 10 },
  { type: 'ENFP', count: 6 },
  { type: 'INTJ', count: 3 },
];

describe('resolveTypeBarFill', () => {
  it('无高亮类型时使用 primary', () => {
    expect(resolveTypeBarFill('INFP', null)).toBe('var(--primary)');
    expect(resolveTypeBarFill('INFP')).toBe('var(--primary)');
  });

  it('匹配高亮类型时使用 chart-3', () => {
    expect(resolveTypeBarFill('INFP', 'INFP')).toBe('var(--chart-3)');
    expect(resolveTypeBarFill('ENFP', 'INFP')).toBe('var(--primary)');
  });
});

describe('TypeDistributionChart', () => {
  it('渲染标题与图表区域', () => {
    render(<TypeDistributionChart data={sampleData} />);
    expect(screen.getByText('16 型人格分布')).toBeInTheDocument();
  });

  it('有高亮类型时显示提示文案', () => {
    render(<TypeDistributionChart data={sampleData} highlightType="INFP" />);
    expect(screen.getByText(/高亮为你的类型/)).toBeInTheDocument();
    expect(screen.getByText('INFP')).toBeInTheDocument();
  });

  it('无高亮类型时不显示登录提示', () => {
    render(<TypeDistributionChart data={sampleData} />);
    expect(screen.queryByText(/高亮为你的类型/)).not.toBeInTheDocument();
  });
});
