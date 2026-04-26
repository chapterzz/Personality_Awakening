/**
 * 结果报告数据单测：信号提取、MBTI 计算请求与本地快照存储。
 */
import { describe, expect, it, vi } from 'vitest';

import { DEMO_AVG_SCRIPT } from '@/data/avg-demo-script';
import { DEMO_STANDARD_CONFIG } from '@/data/standard-demo-questionnaire';
import { createInitialAvgProgress, createInitialStandardProgress } from '@/lib/progress-data';
import {
  buildAvgSignals,
  buildStandardSignals,
  fetchMbtiReport,
  ReportScoringError,
} from '@/lib/report-scoring';
import { clearReportSnapshot, loadReportSnapshot, saveReportSnapshot } from '@/lib/report-storage';

describe('buildStandardSignals', () => {
  it('从标准模式 answers 提取维度信号', () => {
    const progress = createInitialStandardProgress(
      [...DEMO_STANDARD_CONFIG.orderedQuestionIds],
      DEMO_STANDARD_CONFIG.questionnaireId,
    );
    progress.standard.answers.q01 = 'q01_A';
    progress.standard.answers.q02 = 'q02_B';

    const signals = buildStandardSignals(progress, DEMO_STANDARD_CONFIG);
    expect(signals).toHaveLength(2);
    expect(signals[0]).toMatchObject({ dimension: 'EI', side: 'E', weight: 2 });
    expect(signals[1]).toMatchObject({ dimension: 'JP', side: 'J', weight: 2 });
  });
});

describe('buildAvgSignals', () => {
  it('从 AVG 选项答案提取维度信号', () => {
    const progress = createInitialAvgProgress(
      DEMO_AVG_SCRIPT.script_id,
      DEMO_AVG_SCRIPT.start_node_id,
      'EI',
    );
    progress.avg.answers = { energy_choice: 'opt_out' };

    const signals = buildAvgSignals(progress, DEMO_AVG_SCRIPT);
    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({ dimension: 'EI', side: 'E', weight: 2 });
  });
});

describe('fetchMbtiReport', () => {
  it('调用 /scoring/mbti 并返回结果', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          success: true,
          data: {
            mode: 'STANDARD',
            mbti_type: 'ENTJ',
            scores: {
              EI: { E: 8, I: 2, winner: 'E', delta: 6 },
              SN: { S: 3, N: 7, winner: 'N', delta: 4 },
              TF: { T: 7, F: 4, winner: 'T', delta: 3 },
              JP: { J: 6, P: 5, winner: 'J', delta: 1 },
            },
          },
          message: 'ok',
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const out = await fetchMbtiReport({
      mode: 'STANDARD',
      signals: [{ dimension: 'EI', side: 'E', weight: 2 }],
    });

    expect(out.mbti_type).toBe('ENTJ');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/scoring/mbti');

    vi.unstubAllGlobals();
  });

  it('接口返回非法体时抛出 ReportScoringError', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true, data: null, message: 'ok' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchMbtiReport({
        mode: 'AVG',
        signals: [{ dimension: 'EI', side: 'I', weight: 2 }],
      }),
    ).rejects.toBeInstanceOf(ReportScoringError);

    vi.unstubAllGlobals();
  });
});

describe('report-storage', () => {
  it('可保存并读取最近一次报告快照', () => {
    clearReportSnapshot();
    saveReportSnapshot({
      mode: 'STANDARD',
      result: {
        mode: 'STANDARD',
        mbti_type: 'ENFP',
        scores: {
          EI: { E: 6, I: 5, winner: 'E', delta: 1 },
          SN: { S: 3, N: 8, winner: 'N', delta: 5 },
          TF: { T: 2, F: 9, winner: 'F', delta: 7 },
          JP: { J: 4, P: 7, winner: 'P', delta: 3 },
        },
      },
      generated_at: '2026-04-26T00:00:00.000Z',
    });

    const loaded = loadReportSnapshot();
    expect(loaded?.mode).toBe('STANDARD');
    expect(loaded?.result.mbti_type).toBe('ENFP');

    clearReportSnapshot();
    expect(loadReportSnapshot()).toBeNull();
  });
});
