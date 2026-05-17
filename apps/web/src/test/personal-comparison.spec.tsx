/**
 * 个人对比区单测：null 不渲染、有数据时展示类型/占比/排名（T3.4）。
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PersonalComparison } from '@/components/dashboard/personal-comparison';

describe('PersonalComparison', () => {
  it('comparison 为 null 时不渲染', () => {
    const { container } = render(<PersonalComparison comparison={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('有 comparison 时展示类型、占比与排名', () => {
    render(
      <PersonalComparison comparison={{ myType: 'INFP', typePercentage: 14.1, typeRank: 1 }} />,
    );
    expect(screen.getByText('你的位置')).toBeInTheDocument();
    expect(screen.getByText('你是 INFP 类型')).toBeInTheDocument();
    expect(screen.getByText(/14\.1%/)).toBeInTheDocument();
    expect(screen.getByText(/全体探索者/)).toBeInTheDocument();
    expect(screen.getByText(/人数排名第/)).toBeInTheDocument();
    expect(screen.getByText(/共 16 型/)).toBeInTheDocument();
  });
});
