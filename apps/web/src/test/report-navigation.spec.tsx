/**
 * 完成态接入报告页：STANDARD/AVG 点击按钮后生成结果并跳转 `/report`。
 */
import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AvgTestClient } from '@/app/test/avg/avg-test-client';
import { StandardTestClient } from '@/app/test/standard/standard-test-client';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

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

const useStandardTestMock = vi.fn();
vi.mock('@/hooks/use-standard-test', () => ({
  useStandardTest: (...args: unknown[]) => useStandardTestMock(...args),
}));

const useAvgTestMock = vi.fn();
vi.mock('@/hooks/use-avg-test', () => ({
  useAvgTest: (...args: unknown[]) => useAvgTestMock(...args),
}));

const buildStandardSignalsMock = vi.fn();
const buildAvgSignalsMock = vi.fn();
const fetchMbtiReportMock = vi.fn();
vi.mock('@/lib/report-scoring', () => ({
  buildStandardSignals: (...args: unknown[]) => buildStandardSignalsMock(...args),
  buildAvgSignals: (...args: unknown[]) => buildAvgSignalsMock(...args),
  fetchMbtiReport: (...args: unknown[]) => fetchMbtiReportMock(...args),
}));

const saveReportSnapshotMock = vi.fn();
vi.mock('@/lib/report-storage', () => ({
  saveReportSnapshot: (...args: unknown[]) => saveReportSnapshotMock(...args),
}));

describe('report navigation', () => {
  it('标准模式完成态可生成报告并跳转', async () => {
    useStandardTestMock.mockReturnValue({
      phase: 'ready',
      loadError: null,
      saveError: null,
      clearSaveError: () => {},
      reload: () => {},
      authMode: 'guest',
      progressData: {
        schema_version: 1,
        mode: 'STANDARD',
        questionnaire_id: 'demo-standard-v1',
        standard: {
          current_index: 12,
          answers: { q01: 'q01_A' },
          ordered_question_ids: ['q01'],
          answered_count: 1,
        },
      },
      revision: 3,
      saving: false,
      conflictNotice: false,
      totalQuestions: 1,
      answeredCount: 1,
      currentQuestion: null,
      isComplete: true,
      restart: async () => {},
      selectOption: async () => {},
    });
    buildStandardSignalsMock.mockReturnValue([{ dimension: 'EI', side: 'E', weight: 2 }]);
    fetchMbtiReportMock.mockResolvedValue({
      mode: 'STANDARD',
      mbti_type: 'ENTJ',
      scores: {
        EI: { E: 7, I: 3, winner: 'E', delta: 4 },
        SN: { S: 4, N: 6, winner: 'N', delta: 2 },
        TF: { T: 8, F: 2, winner: 'T', delta: 6 },
        JP: { J: 6, P: 4, winner: 'J', delta: 2 },
      },
    });

    render(<StandardTestClient />);
    fireEvent.click(screen.getByRole('button', { name: '查看结果报告' }));

    await waitFor(() => {
      expect(fetchMbtiReportMock).toHaveBeenCalled();
      expect(saveReportSnapshotMock).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith('/report?mode=STANDARD');
    });
  });

  it('AVG 模式完成态可生成报告并跳转', async () => {
    useAvgTestMock.mockReturnValue({
      phase: 'ready',
      loadError: null,
      saveError: null,
      clearSaveError: () => {},
      reload: () => {},
      authMode: 'guest',
      progressData: {
        schema_version: 1,
        mode: 'AVG',
        questionnaire_id: 'demo-avg-v1',
        avg: {
          script_id: 'demo-avg-v1',
          node_id: 'closing',
          answers: { energy_choice: 'opt_out' },
          visited_node_ids: ['intro', 'energy_choice', 'path_e', 'closing'],
        },
      },
      revision: 2,
      saving: false,
      conflictNotice: false,
      currentNode: {
        kind: 'end',
        chapter: 'EI',
        background_key: 'night',
        lines: [],
      },
      isComplete: true,
      stepIndex: 1,
      totalSteps: 1,
      restart: async () => {},
      continueDialogue: async () => {},
      selectOption: async () => {},
    });
    buildAvgSignalsMock.mockReturnValue([{ dimension: 'EI', side: 'I', weight: 2 }]);
    fetchMbtiReportMock.mockResolvedValue({
      mode: 'AVG',
      mbti_type: 'INFP',
      scores: {
        EI: { E: 3, I: 8, winner: 'I', delta: 5 },
        SN: { S: 4, N: 6, winner: 'N', delta: 2 },
        TF: { T: 2, F: 9, winner: 'F', delta: 7 },
        JP: { J: 5, P: 6, winner: 'P', delta: 1 },
      },
    });

    render(<AvgTestClient />);
    fireEvent.click(screen.getByRole('button', { name: '查看结果报告' }));

    await waitFor(() => {
      expect(fetchMbtiReportMock).toHaveBeenCalled();
      expect(saveReportSnapshotMock).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith('/report?mode=AVG');
    });
  });
});
