/**
 * useStandardTest 加载逻辑单测：AVG 已收束时自动 PUT 标准初值（防「仅测纯函数漏掉跨 mode 串联」类回归）。
 * 须放在 `src/test/`，勿放在 `app/` 下以免 Next 将 spec 误当作路由。
 */
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DemoStandardConfig } from '@/data/standard-demo-questionnaire';
import { useStandardTest } from '@/hooks/use-standard-test';
import {
  createInitialAvgProgress,
  createInitialStandardProgress,
  type AvgProgressDataV1,
} from '@/lib/progress-data';
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
        { id: 'q01_A', label: 'A' },
        { id: 'q01_B', label: 'B' },
      ],
    },
    q02: {
      id: 'q02',
      text: 'Q2?',
      options: [
        { id: 'q02_A', label: 'A' },
        { id: 'q02_B', label: 'B' },
      ],
    },
  },
};

const metaTimes = {
  updated_at: '2020-01-01T00:00:00.000Z',
  expires_at: '2030-01-01T00:00:00.000Z',
};

const avgAtClosing: AvgProgressDataV1 = {
  schema_version: 1,
  mode: 'AVG',
  questionnaire_id: 'demo-avg-v1',
  avg: {
    script_id: 'demo-avg-v1',
    node_id: 'closing',
    chapter: 'EI',
    answers: { energy_choice: 'opt_in' },
    visited_node_ids: ['intro', 'energy_choice', 'path_i', 'closing'],
  },
};

const avgClosingSnapshot: ProgressSnapshot = {
  session_id: 'guest-test-sid',
  user_id: null,
  progress_data: avgAtClosing,
  progress_revision: 3,
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
  });

  it('GET 为 AVG 收束态时调用 putProgress 写入标准初值并进入 ready', async () => {
    vi.mocked(progressApi.getProgress).mockResolvedValue(avgClosingSnapshot);
    const initialStd = createInitialStandardProgress(
      [...MIN_STANDARD_CONFIG.orderedQuestionIds],
      MIN_STANDARD_CONFIG.questionnaireId,
    );
    vi.mocked(progressApi.putProgress).mockResolvedValue({
      ...avgClosingSnapshot,
      progress_data: initialStd,
      progress_revision: 4,
    });

    render(<PhaseProbe />);

    await waitFor(() => {
      expect(screen.getByTestId('phase')).toHaveTextContent('ready');
    });
    expect(progressApi.putProgress).toHaveBeenCalledOnce();
  });

  it('GET 为 AVG 进行中时为 wrong_mode 且不调用 putProgress', async () => {
    const mid: ProgressSnapshot = {
      ...avgClosingSnapshot,
      progress_data: createInitialAvgProgress('demo-avg-v1', 'intro', 'EI'),
      progress_revision: 1,
    };
    vi.mocked(progressApi.getProgress).mockResolvedValue(mid);

    render(<PhaseProbe />);

    await waitFor(() => {
      expect(screen.getByTestId('phase')).toHaveTextContent('wrong_mode');
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
      ...avgClosingSnapshot,
      progress_data: std,
      progress_revision: 2,
    });

    render(<PhaseProbe />);

    await waitFor(() => {
      expect(screen.getByTestId('phase')).toHaveTextContent('ready');
    });
    expect(progressApi.putProgress).not.toHaveBeenCalled();
  });
});
