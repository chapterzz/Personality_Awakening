/**
 * AVG 分支进度条：仅统计需玩家做选择的节点（对白「继续」不计入），与 `avg.answers` 对齐。
 * 2026-05-01 UI 重构：加高、渐变填充、glow 阴影。
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
        className="h-3 w-full overflow-hidden rounded-full bg-[#FECDD3]/40 dark:bg-[#4A1A24]"
        role="progressbar"
        aria-valuenow={stepIndex}
        aria-valuemin={0}
        aria-valuemax={totalSteps}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#FB7185] to-[#E11D48] shadow-[0_0_8px_rgba(225,29,72,0.3)] transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
