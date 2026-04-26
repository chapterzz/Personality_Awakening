/**
 * useStandardTest 加载逻辑单测：STANDARD mode 独立读写；完成态不再自动 reset（由用户手动重开）。
 * 须放在 `src/test/`，勿放在 `app/` 下以免 Next 将 spec 误当作路由。
 */
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DemoStandardConfig } from '@/data/standard-demo-questionnaire';
import { useStandardTest } from '@/hooks/use-standard-test';
import { createInitialStandardProgress, type StandardProgressDataV1 } from '@/lib/progress-data';
import type { ProgressSnapshot } from '@/lib/progress-api';

vi.mock('@/lib/auth-token', () => ({
  getAccessToken: () => null,
}));

vi.mock('@/lib/guest-session-id', () => ({
  getOrCreateGuestSessionId: () => 'guest-test-sid',
}));

vi.mock('@/lib/progress-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/progress-api')>();
  return {
    ...actual,
    getProgress: vi.fn(),
    putProgress: vi.fn(),
    deleteProgress: vi.fn(),
  };
});

import * as progressApi from '@/lib/progress-api';

/** 最小题库，避免本文件拉入 12 题演示配置增大 worker 内存占用 */
const MIN_STANDARD_CONFIG: DemoStandardConfig = {
  questionnaireId: 'demo-standard-v1',
  orderedQuestionIds: ['q01', 'q02'],
  questions: {
    q01: {
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
    },
    q02: {
      id: 'q02',
      text: 'Q2?',
      options: [
        {
          id: 'q02_A',
          label: 'A',
          dimension: 'SN' as const,
          side: 'S' as const,
          weight: 2 as const,
        },
        {
          id: 'q02_B',
          label: 'B',
          dimension: 'SN' as const,
          side: 'N' as const,
          weight: 2 as const,
        },
      ],
    },
  },
};

const metaTimes = {
  updated_at: '2020-01-01T00:00:00.000Z',
  expires_at: '2030-01-01T00:00:00.000Z',
};

const stdInProgress: StandardProgressDataV1 = {
  schema_version: 1,
  mode: 'STANDARD',
  questionnaire_id: 'demo-standard-v1',
  standard: {
    current_index: 1,
    ordered_question_ids: ['q01', 'q02'],
    answers: { q01: 'q01_A' },
    answered_count: 1,
  },
};

const standardSnapshot: ProgressSnapshot = {
  session_id: 'guest-test-sid',
  user_id: null,
  progress_data: stdInProgress,
  progress_revision: 2,
  ...metaTimes,
};

function PhaseProbe() {
  const t = useStandardTest(MIN_STANDARD_CONFIG);
  return <p data-testid="phase">{t.phase}</p>;
}

describe('useStandardTest', () => {
  beforeEach(() => {
    vi.mocked(progressApi.getProgress).mockReset();
    vi.mocked(progressApi.putProgress).mockReset();
    vi.mocked(progressApi.deleteProgress).mockReset();
  });

  it('GET 为 STANDARD 时进入 ready，且请求携带 mode=STANDARD', async () => {
    vi.mocked(progressApi.getProgress).mockResolvedValue(standardSnapshot);

    render(<PhaseProbe />);

    await waitFor(() => {
      expect(screen.getByTestId('phase')).toHaveTextContent('ready');
    });
    expect(progressApi.getProgress).toHaveBeenCalledWith({
      mode: 'STANDARD',
      accessToken: null,
      sessionId: 'guest-test-sid',
    });
    expect(progressApi.putProgress).not.toHaveBeenCalled();
  });

  it('GET 已为 STANDARD 时直接 ready 且不迁移', async () => {
    const std = createInitialStandardProgress(
      [...MIN_STANDARD_CONFIG.orderedQuestionIds],
      MIN_STANDARD_CONFIG.questionnaireId,
    );
    std.standard.current_index = 2;
    vi.mocked(progressApi.getProgress).mockResolvedValue({
      ...standardSnapshot,
      progress_data: std,
      progress_revision: 2,
    });

    render(<PhaseProbe />);

    await waitFor(() => {
      expect(screen.getByTestId('phase')).toHaveTextContent('ready');
    });
    expect(progressApi.putProgress).not.toHaveBeenCalled();
  });

  it('GET 为 STANDARD 且本卷已答完时不自动 delete/reset（由用户手动重开）', async () => {
    const stdComplete: StandardProgressDataV1 = {
      schema_version: 1,
      mode: 'STANDARD',
      questionnaire_id: 'demo-standard-v1',
      standard: {
        current_index: 2,
        ordered_question_ids: ['q01', 'q02'],
        answers: { q01: 'q01_A', q02: 'q02_B' },
        answered_count: 2,
      },
    };
    vi.mocked(progressApi.getProgress).mockResolvedValueOnce({
      ...standardSnapshot,
      progress_data: stdComplete,
      progress_revision: 5,
    });

    render(<PhaseProbe />);

    await waitFor(() => {
      expect(screen.getByTestId('phase')).toHaveTextContent('ready');
    });
    expect(progressApi.deleteProgress).not.toHaveBeenCalled();
    expect(progressApi.getProgress).toHaveBeenCalledTimes(1);
  });
});
