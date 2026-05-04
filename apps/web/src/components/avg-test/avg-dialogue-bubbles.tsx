/**
 * AVG 对话气泡区：按 `speaker` 区分样式，支持多行对白堆叠。
 * 2026-05-01 UI 重构：加粗边框 border-2 + font-display 说话人标签。
 */
import type { AvgLine } from '@/data/avg-demo-script';
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
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {lines.map((line, i) => (
        <div
          key={`${line.speaker}-${i}`}
          className={cn(
            'max-w-[95%] rounded-2xl border-2 px-4 py-3 text-base leading-relaxed shadow-sm sm:max-w-xl',
            line.speaker === 'narrator' &&
              'border-border/60 bg-background/85 text-foreground backdrop-blur-sm',
            line.speaker === 'sprite' &&
              'ml-0 border-primary/25 bg-primary/10 text-foreground sm:ml-4',
            line.speaker === 'player' &&
              'ml-auto border-secondary/30 bg-secondary/15 text-foreground sm:mr-4',
          )}
        >
          <p className="text-xs font-display font-bold uppercase tracking-wide text-muted-foreground">
            {SPEAKER_LABEL[line.speaker]}
          </p>
          <p className="mt-1 text-pretty text-foreground">{line.text}</p>
        </div>
      ))}
    </div>
  );
}
