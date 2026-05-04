/**
 * 标准模式测评顶部进度条：按已答题数 / 总题数展示（PRD：整体进度条）。
 * 2026-05-01 UI 重构：加高、渐变填充、glow 阴影。
 */
type StandardTestProgressBarProps = {
  answered: number;
  total: number;
};

export function StandardTestProgressBar({ answered, total }: StandardTestProgressBarProps) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>答题进度</span>
        <span>
          {answered} / {total}
        </span>
      </div>
      <div
        className="h-3 w-full overflow-hidden rounded-full bg-[#FECDD3]/40 dark:bg-[#4A1A24]"
        role="progressbar"
        aria-valuenow={answered}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#FB7185] to-[#E11D48] shadow-[0_0_8px_rgba(225,29,72,0.3)] transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
