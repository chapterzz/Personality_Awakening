/**
 * AVG 分支进度条：仅统计需玩家做选择的节点（对白「继续」不计入），与 `avg.answers` 对齐。
 */
type AvgStoryProgressBarProps = {
  stepIndex: number;
  totalSteps: number;
};

export function AvgStoryProgressBar({ stepIndex, totalSteps }: AvgStoryProgressBarProps) {
  const pct = totalSteps > 0 ? Math.round((Math.min(stepIndex, totalSteps) / totalSteps) * 100) : 0;
  return (
    <div className="space-y-2">
      <div
        className="flex justify-between text-sm text-muted-foreground"
        title="仅统计选项分支；点击「继续」推进对白不计入。"
      >
        <span>分支进度</span>
        <span>
          {stepIndex} / {totalSteps}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted/80"
        role="progressbar"
        aria-valuenow={stepIndex}
        aria-valuemin={0}
        aria-valuemax={totalSteps}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
