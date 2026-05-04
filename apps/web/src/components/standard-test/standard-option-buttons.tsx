/**
 * 标准模式选项区：大触控区域，移动端优先可读性。
 * 2026-05-01 UI 重构：加大触控区、添加按压缩放动画。
 */
import { Button } from '@/components/ui/button';

import type { DemoOption } from '@/data/standard-demo-questionnaire';

type StandardOptionButtonsProps = {
  options: DemoOption[];
  onSelect: (optionId: string) => void;
  disabled?: boolean;
};

export function StandardOptionButtons({ options, onSelect, disabled }: StandardOptionButtonsProps) {
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
