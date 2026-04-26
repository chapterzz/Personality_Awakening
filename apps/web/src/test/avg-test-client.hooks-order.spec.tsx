/**
 * AvgTestClient 回归：phase 从 loading -> ready 切换时不应触发「Rendered more hooks...」。
 * 目的：拦截未来把 hook 写到早返回之后的回归。
 */
import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AvgTestClient } from '@/app/test/avg/avg-test-client';

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

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-sprite-interaction', () => ({
  useSpriteInteraction: () => ({
    prompt: null,
    dismissPrompt: () => {},
    setChoiceContext: () => {},
    recordChoice: () => {},
  }),
}));

const BASE = {
  loadError: null,
  saveError: null,
  clearSaveError: () => {},
  reload: () => {},
  authMode: 'guest' as const,
  progressData: null,
  revision: 0,
  saving: false,
  conflictNotice: false,
  currentNode: null,
  isComplete: false,
  stepIndex: 0,
  totalSteps: 1,
  continueDialogue: async () => {},
  selectOption: async () => {},
};

const useAvgTestMock = vi.fn();
vi.mock('@/hooks/use-avg-test', () => ({
  useAvgTest: (...args: unknown[]) => useAvgTestMock(...args),
}));

describe('AvgTestClient hooks order', () => {
  it('loading -> ready rerender should not log Rendered more hooks', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});

    useAvgTestMock.mockReturnValueOnce({ ...BASE, phase: 'loading' as const });
    useAvgTestMock.mockReturnValueOnce({ ...BASE, phase: 'ready' as const });

    const { rerender } = render(<AvgTestClient />);
    expect(() => rerender(<AvgTestClient />)).not.toThrow();

    const joined = err.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(joined).not.toMatch(/Rendered more hooks than during the previous render/i);

    err.mockRestore();
  });
});
