/**
 * StandardTestClient 回归：phase 从 loading -> ready 时不应触发「Rendered more hooks...」。
 * 目的：拦截未来把 hook 写到早返回之后的回归。
 */
import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { StandardTestClient } from '@/app/test/standard/standard-test-client';

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
  totalQuestions: 12,
  answeredCount: 0,
  currentQuestion: null,
  isComplete: false,
  selectOption: async () => {},
};

const useStandardTestMock = vi.fn();
vi.mock('@/hooks/use-standard-test', () => ({
  useStandardTest: (...args: unknown[]) => useStandardTestMock(...args),
}));

describe('StandardTestClient hooks order', () => {
  it('loading -> ready rerender should not log Rendered more hooks', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});

    useStandardTestMock.mockReturnValueOnce({ ...BASE, phase: 'loading' as const });
    const readyQuestion = {
      id: 'q01',
      text: 'Q1?',
      options: [
        {
          id: 'q01_A',
          label: 'A',
          dimension: 'EI' as const,
          side: 'E' as const,
          weight: 2 as const,
        },
        {
          id: 'q01_B',
          label: 'B',
          dimension: 'EI' as const,
          side: 'I' as const,
          weight: 2 as const,
        },
      ],
    };
    useStandardTestMock.mockReturnValueOnce({
      ...BASE,
      phase: 'ready' as const,
      currentQuestion: readyQuestion,
      progressData: {
        schema_version: 1,
        mode: 'STANDARD' as const,
        questionnaire_id: 'demo-standard-v1',
        standard: {
          current_index: 0,
          answers: {},
          ordered_question_ids: ['q01'],
          answered_count: 0,
        },
      },
    });

    const { rerender } = render(<StandardTestClient />);
    expect(() => rerender(<StandardTestClient />)).not.toThrow();

    const joined = err.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(joined).not.toMatch(/Rendered more hooks than during the previous render/i);

    err.mockRestore();
  });
});
