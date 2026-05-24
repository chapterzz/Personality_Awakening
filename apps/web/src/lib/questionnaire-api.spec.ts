/**
 * questionnaire-api 单测：fetchQuestionnaire 与 fetchQuestionSequence 的请求与响应解析。
 */
import { describe, expect, it, vi } from 'vitest';

import { fetchQuestionnaire, fetchQuestionSequence } from './questionnaire-api';

const mockQuestionnaireResponse = {
  success: true,
  data: {
    id: 'standard-v1',
    title: '测试问卷',
    questions: [
      {
        id: 'sr-ei-01',
        prompt: 'EI question',
        dimension: 'EI',
        groupTag: null,
        options: [
          {
            id: 'sr-ei-01_A',
            label: 'E',
            valueKey: 'sr-ei-01_A',
            dimension: 'EI',
            side: 'E',
            weight: 2,
          },
          {
            id: 'sr-ei-01_B',
            label: 'I',
            valueKey: 'sr-ei-01_B',
            dimension: 'EI',
            side: 'I',
            weight: 2,
          },
        ],
      },
    ],
  },
  message: null,
};

const mockSequenceResponse = {
  success: true,
  data: {
    questionnaire_id: 'standard-v1',
    ordered_question_ids: Array.from({ length: 48 }, (_, i) => `q-${i + 1}`),
  },
  message: null,
};

describe('fetchQuestionnaire', () => {
  it('成功时返回问卷结构', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockQuestionnaireResponse),
    });
    vi.stubGlobal('fetch', fetchMock);

    const data = await fetchQuestionnaire('standard-v1');
    expect(data.id).toBe('standard-v1');
    expect(data.questions).toHaveLength(1);
    expect(data.questions[0].options).toHaveLength(2);

    vi.unstubAllGlobals();
  });

  it('HTTP 失败时抛出错误', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ success: false, data: null, message: 'not found' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchQuestionnaire('nonexistent')).rejects.toThrow('questionnaire_fetch_failed');

    vi.unstubAllGlobals();
  });

  it('响应格式无效时抛出错误', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: false, data: null }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchQuestionnaire('standard-v1')).rejects.toThrow(
      'questionnaire_response_invalid',
    );

    vi.unstubAllGlobals();
  });
});

describe('fetchQuestionSequence', () => {
  it('成功时返回题序', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockSequenceResponse),
    });
    vi.stubGlobal('fetch', fetchMock);

    const data = await fetchQuestionSequence('standard-v1');
    expect(data.questionnaire_id).toBe('standard-v1');
    expect(data.ordered_question_ids).toHaveLength(48);

    vi.unstubAllGlobals();
  });

  it('reuse 策略时 POST body 包含 previous_ordered_question_ids', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockSequenceResponse),
    });
    vi.stubGlobal('fetch', fetchMock);

    const previous = ['q-1', 'q-2'];
    await fetchQuestionSequence('standard-v1', {
      strategy: 'reuse',
      previousOrderedQuestionIds: previous,
    });

    const callArgs = fetchMock.mock.calls[0];
    const body = JSON.parse((callArgs[1] as RequestInit).body as string);
    expect(body.strategy).toBe('reuse');
    expect(body.previous_ordered_question_ids).toEqual(previous);

    vi.unstubAllGlobals();
  });

  it('HTTP 失败时抛出错误', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ success: false, data: null }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchQuestionSequence('standard-v1')).rejects.toThrow('sequence_fetch_failed');

    vi.unstubAllGlobals();
  });
});
