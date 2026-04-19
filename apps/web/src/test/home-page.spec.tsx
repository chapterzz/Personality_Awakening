/**
 * 首页布局单测：主内容须含 max-w-2xl + mx-auto（防宽屏下挤在左上角类回归）。
 * 须放在 `src/test/`，勿放在 `app/` 下以免 Next 将 spec 误当作路由。
 */
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Home from '@/app/page';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('Home', () => {
  it('根容器含居中限宽类名', () => {
    const { container } = render(<Home />);
    const root = container.firstElementChild;
    expect(root).toBeTruthy();
    expect(root?.className).toMatch(/max-w-2xl/);
    expect(root?.className).toMatch(/mx-auto/);
    expect(screen.getByRole('heading', { name: '性格星球：觉醒计划' })).toBeInTheDocument();
  });
});
