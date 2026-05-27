/**
 * AVG 对话气泡区：按 `speaker` 区分样式，支持多行对白堆叠。
 * 2026-05-01 UI 重构：加粗边框 border-2 + font-display 说话人标签。
 * 2026-05-24 方案 C：仅气泡内毛玻璃；文字随舞台背景冷暖自动取反差色。
 */
'use client';

import { useAvgStageTone } from '@/components/avg-test/avg-stage-tone-context';
import type { AvgLine } from '@/data/avg-demo-script';
import { BUBBLE_TEXT_BY_TONE } from '@/lib/avg-background-tone';
import { cn } from '@/lib/utils';

const SPEAKER_LABEL: Record<AvgLine['speaker'], string> = {
  narrator: '旁白',
  sprite: '精灵',
  player: '你',
};

type AvgDialogueBubblesProps = {
  lines: AvgLine[];
  className?: string;
};

export function AvgDialogueBubbles({ lines, className }: AvgDialogueBubblesProps) {
  const tone = useAvgStageTone();
  const textStyle = BUBBLE_TEXT_BY_TONE[tone];

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {lines.map((line, i) => (
        <div
          key={`${line.speaker}-${i}`}
          className={cn(
            'max-w-[95%] rounded-2xl border-2 px-4 py-3 text-base leading-relaxed shadow-sm backdrop-blur-md sm:max-w-xl',
            line.speaker === 'narrator' && cn('bg-background/75', textStyle.narratorBorder),
            line.speaker === 'sprite' && 'ml-0 border-primary/25 bg-primary/10 sm:ml-4',
            line.speaker === 'player' && 'ml-auto border-secondary/30 bg-secondary/15 sm:mr-4',
          )}
        >
          <p
            className={cn(
              'text-xs font-display font-bold uppercase tracking-wide',
              textStyle.label,
            )}
          >
            {SPEAKER_LABEL[line.speaker]}
          </p>
          <p className={cn('mt-1 text-pretty', textStyle.body)}>{line.text}</p>
        </div>
      ))}
    </div>
  );
}
