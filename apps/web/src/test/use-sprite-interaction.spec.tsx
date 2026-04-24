/**
 * useSpriteInteraction 单测：验证 30s 犹豫提示的触发与上下文重置。
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useEffect } from 'react';

import { useSpriteInteraction } from '@/hooks/use-sprite-interaction';

function Probe(props: { ctxId: string; active: boolean }) {
  const t = useSpriteInteraction({
    hesitationMs: 30_000,
    getHesitationLine: () => '你在犹豫吗？我可以给你一点提示。',
    getMutexLine: () => '你有点纠结哦～',
  });

  // 通过 props 驱动 context 变化（避免在 render 阶段触发 setState）
  useEffect(() => {
    t.setChoiceContext({ contextId: props.ctxId, active: props.active });
  }, [props.active, props.ctxId, t.setChoiceContext]);

  return <p data-testid="prompt">{t.prompt?.text ?? ''}</p>;
}

function MutexProbe() {
  const t = useSpriteInteraction({
    hesitationMs: 30_000,
    mutexWindowMs: 120_000,
    strongWeightMin: 2,
    getHesitationLine: () => 'hesitate',
    getMutexLine: (d) => `mutex-${d}`,
  });

  useEffect(() => {
    t.setChoiceContext({ contextId: 'q01', active: true });
  }, [t.setChoiceContext]);

  return (
    <div>
      <button
        type="button"
        data-testid="pick-e"
        onClick={() => {
          t.recordChoice({ dimension: 'EI', side: 'E', weight: 2 }, 'q01');
        }}
      >
        pick-e
      </button>
      <button
        type="button"
        data-testid="pick-i"
        onClick={() => {
          t.recordChoice({ dimension: 'EI', side: 'I', weight: 2 }, 'q02');
        }}
      >
        pick-i
      </button>
      <p data-testid="prompt">{t.prompt?.text ?? ''}</p>
    </div>
  );
}

describe('useSpriteInteraction', () => {
  it('30s 未选择会触发犹豫提示；上下文变化会重置', async () => {
    vi.useFakeTimers();
    const { rerender } = render(<Probe ctxId="q01" active={true} />);

    expect(screen.getByTestId('prompt')).toHaveTextContent('');
    await vi.advanceTimersByTimeAsync(30_001);
    expect(screen.getByTestId('prompt')).toHaveTextContent('你在犹豫吗？');

    // 切换题目：提示应清空并重新计时
    rerender(<Probe ctxId="q02" active={true} />);
    expect(screen.getByTestId('prompt')).toHaveTextContent('');
    await vi.advanceTimersByTimeAsync(29_000);
    expect(screen.getByTestId('prompt')).toHaveTextContent('');
    await vi.advanceTimersByTimeAsync(1_500);
    expect(screen.getByTestId('prompt')).toHaveTextContent('你在犹豫吗？');

    vi.useRealTimers();
  });

  it('recordChoice 命中互斥时弹出 mutex 提示', async () => {
    vi.useFakeTimers();
    render(<MutexProbe />);
    fireEvent.click(screen.getByTestId('pick-e'));
    vi.advanceTimersByTime(1);
    fireEvent.click(screen.getByTestId('pick-i'));
    expect(screen.getByTestId('prompt')).toHaveTextContent('mutex-EI');
    vi.useRealTimers();
  });
});
