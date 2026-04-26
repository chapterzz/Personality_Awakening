/**
 * 结果页组件单测：文案映射、精灵卡、雷达图核心维度渲染。
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MbtiAnalysisCard } from '@/components/report/mbti-analysis-card';
import { MbtiRadarCard } from '@/components/report/mbti-radar-card';
import { SpriteProfileCard } from '@/components/report/sprite-profile-card';
import { MBTI_COPY, getMbtiCopy } from '@/lib/report-copy';

describe('report-copy', () => {
  it('提供 16 型完整文案映射', () => {
    expect(Object.keys(MBTI_COPY)).toHaveLength(16);
    expect(getMbtiCopy('INFP').title).toContain('INFP');
  });
});

describe('MbtiAnalysisCard', () => {
  it('按类型渲染解析文案', () => {
    render(<MbtiAnalysisCard mbtiType="INFP" />);
    expect(screen.getByText(/INFP/)).toBeInTheDocument();
  });
});

describe('SpriteProfileCard', () => {
  it('按类型渲染精灵展示卡', () => {
    render(<SpriteProfileCard mbtiType="ENTJ" />);
    expect(screen.getByText(/ENTJ/)).toBeInTheDocument();
    expect(screen.getByText(/人格精灵/)).toBeInTheDocument();
  });
});

describe('MbtiRadarCard', () => {
  it('渲染四维雷达图与维度标签', () => {
    render(
      <MbtiRadarCard
        scores={{
          EI: { E: 8, I: 2, winner: 'E', delta: 6 },
          SN: { S: 3, N: 7, winner: 'N', delta: 4 },
          TF: { T: 4, F: 6, winner: 'F', delta: 2 },
          JP: { J: 5, P: 5, winner: 'J', delta: 0 },
        }}
      />,
    );

    expect(screen.getByText('EI')).toBeInTheDocument();
    expect(screen.getByText('SN')).toBeInTheDocument();
    expect(screen.getByText('TF')).toBeInTheDocument();
    expect(screen.getByText('JP')).toBeInTheDocument();
  });
});
