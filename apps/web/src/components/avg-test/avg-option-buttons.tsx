/**
 * AVG 分支选项：大触控区，与标准模式交互一致。
 * 2026-05-01 UI 重构：加大触控区、添加按压缩放动画。
 */
import { Button } from '@/components/ui/button';

export type AvgOptionItem = { id: string; label: string };

type AvgOptionButtonsProps = {
  options: AvgOptionItem[];
  onSelect: (optionId: string) => void;
  disabled?: boolean;
};

export function AvgOptionButtons({ options, onSelect, disabled }: AvgOptionButtonsProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {options.map((o) => (
        <Button
          key={o.id}
          type="button"
          variant="outline"
          className="h-auto min-h-12 flex-1 justify-center whitespace-normal py-3 text-left text-base font-medium sm:min-w-[220px] active:scale-95 transition-transform duration-200"
          disabled={disabled}
          onClick={() => onSelect(o.id)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}
