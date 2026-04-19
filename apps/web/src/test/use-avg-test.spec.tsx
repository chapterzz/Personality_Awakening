/**
 * useAvgTest 单测：服务端 AVG 快照续答、对白推进保存遇 409 时采用服务端进度（T2.2 / PRD §2.5）。
 * 须放在 `src/test/`，勿放在 `app/` 下以免 Next 将 spec 误当作路由。
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEMO_AVG_SCRIPT } from '@/data/avg-demo-script';
import { useAvgTest } from '@/hooks/use-avg-test';
import { createInitialAvgProgress, type AvgProgressDataV1 } from '@/lib/progress-data';
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

const metaTimes = {
  updated_at: '2020-01-01T00:00:00.000Z',
  expires_at: '2030-01-01T00:00:00.000Z',
};

const baseSnap = (data: AvgProgressDataV1, revision: number): ProgressSnapshot => ({
  session_id: 'guest-test-sid',
  user_id: null,
  progress_data: data,
  progress_revision: revision,
  ...metaTimes,
});

function AvgHarness() {
  const t = useAvgTest(DEMO_AVG_SCRIPT);
  return (
    <div>
      <p data-testid="phase">{t.phase}</p>
      <p data-testid="node">{t.progressData?.avg.node_id ?? ''}</p>
      <p data-testid="conflict">{t.conflictNotice ? 'yes' : 'no'}</p>
      <button type="button" data-testid="continue" onClick={() => void t.continueDialogue()}>
        继续
      </button>
    </div>
  );
}

describe('useAvgTest', () => {
  beforeEach(() => {
    vi.mocked(progressApi.getProgress).mockReset();
    vi.mocked(progressApi.putProgress).mockReset();
  });

  it('GET 返回 AVG 中间节点时进入 ready 并展示该 node_id（续答）', async () => {
    const mid: AvgProgressDataV1 = {
      schema_version: 1,
      mode: 'AVG',
      questionnaire_id: DEMO_AVG_SCRIPT.script_id,
      avg: {
        script_id: DEMO_AVG_SCRIPT.script_id,
        node_id: 'energy_choice',
        chapter: 'EI',
        answers: {},
        visited_node_ids: ['intro', 'energy_choice'],
      },
    };
    vi.mocked(progressApi.getProgress).mockResolvedValue(baseSnap(mid, 4));

    render(<AvgHarness />);

    await waitFor(() => {
      expect(screen.getByTestId('phase')).toHaveTextContent('ready');
    });
    expect(screen.getByTestId('node')).toHaveTextContent('energy_choice');
    expect(progressApi.putProgress).not.toHaveBeenCalled();
  });

  it('对白推进后 putProgress 返回 409 时采用服务端 avg 并标记 conflict', async () => {
    const intro = createInitialAvgProgress(
      DEMO_AVG_SCRIPT.script_id,
      DEMO_AVG_SCRIPT.start_node_id,
      'EI',
    );
    vi.mocked(progressApi.getProgress).mockResolvedValue(baseSnap(intro, 1));

    const serverAhead: AvgProgressDataV1 = {
      schema_version: 1,
      mode: 'AVG',
      avg: {
        script_id: DEMO_AVG_SCRIPT.script_id,
        node_id: 'path_i',
        chapter: 'EI',
        answers: { energy_choice: 'opt_in' },
        visited_node_ids: ['intro', 'energy_choice', 'path_i'],
      },
    };

    vi.mocked(progressApi.putProgress).mockRejectedValue(
      new progressApi.ProgressRevisionConflictError({
        progress_data: serverAhead,
        progress_revision: 9,
        updated_at: '2020-01-02T00:00:00.000Z',
      }),
    );

    render(<AvgHarness />);

    await waitFor(() => {
      expect(screen.getByTestId('phase')).toHaveTextContent('ready');
    });

    fireEvent.click(screen.getByTestId('continue'));

    await waitFor(() => {
      expect(screen.getByTestId('conflict')).toHaveTextContent('yes');
    });
    expect(screen.getByTestId('node')).toHaveTextContent('path_i');
    expect(progressApi.putProgress).toHaveBeenCalledOnce();
  });
});
