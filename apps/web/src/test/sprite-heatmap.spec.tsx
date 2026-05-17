/**
 * 看板精灵热力图单测：计数/配色纯函数与组件渲染（T3.3）。
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  SpriteHeatmap,
  computeHeatmapMaxCount,
  getHeatmapCellBackground,
  getHeatmapCount,
  getHighlightColumnCellClassName,
  resolveSpriteRowColor,
} from '@/components/dashboard/sprite-heatmap';

const sampleData = [
  { type: 'INFP', sprite: '月影探索精灵', count: 10 },
  { type: 'ENFP', sprite: '曦光领航精灵', count: 6 },
];

describe('getHeatmapCount', () => {
  it('匹配 type+sprite 返回 count', () => {
    expect(getHeatmapCount(sampleData, 'INFP', '月影探索精灵')).toBe(10);
  });

  it('缺失返回 0', () => {
    expect(getHeatmapCount(sampleData, 'INFP', '曦光领航精灵')).toBe(0);
  });
});

describe('computeHeatmapMaxCount', () => {
  it('空数组返回 1', () => {
    expect(computeHeatmapMaxCount([])).toBe(1);
  });

  it('取最大 count', () => {
    expect(computeHeatmapMaxCount(sampleData)).toBe(10);
  });
});

describe('resolveSpriteRowColor', () => {
  it('曦光使用 chart-1', () => {
    expect(resolveSpriteRowColor('曦光领航精灵')).toBe('var(--chart-1)');
  });

  it('月影使用 chart-2', () => {
    expect(resolveSpriteRowColor('月影探索精灵')).toBe('var(--chart-2)');
  });
});

describe('getHeatmapCellBackground', () => {
  it('count 为 0 时使用低比例 color-mix', () => {
    expect(getHeatmapCellBackground('曦光领航精灵', 0, 10)).toContain('color-mix');
    expect(getHeatmapCellBackground('曦光领航精灵', 0, 10)).toContain('8%');
  });

  it('count 等于 max 时混色比例高于较小 count', () => {
    const low = getHeatmapCellBackground('曦光领航精灵', 1, 10);
    const high = getHeatmapCellBackground('曦光领航精灵', 10, 10);
    expect(high).not.toBe(low);
  });
});

describe('getHighlightColumnCellClassName', () => {
  it('H-D：匹配列返回外发光 class', () => {
    expect(getHighlightColumnCellClassName('INFP', 'INFP')).toContain('shadow-');
  });

  it('不匹配列无高亮 class', () => {
    expect(getHighlightColumnCellClassName('ENFP', 'INFP')).toBe('');
  });
});

describe('SpriteHeatmap', () => {
  it('渲染标题与 L-A 渐变图例', () => {
    render(<SpriteHeatmap data={sampleData} />);
    expect(screen.getByText('类型 × 精灵热力图')).toBeInTheDocument();
    expect(screen.getByText('少')).toBeInTheDocument();
    expect(screen.getByText('多')).toBeInTheDocument();
  });

  it('有高亮类型时显示提示文案与列头高亮', () => {
    render(<SpriteHeatmap data={sampleData} highlightType="INFP" />);
    expect(screen.getByText(/高亮为你的类型/)).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'INFP' })).toHaveClass('text-[var(--chart-3)]');
  });
});
