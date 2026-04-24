/**
 * 精灵提示气泡（T2.3）：用于展示“犹豫”与“纠结（互斥）”互动文案（不依赖 toast 系统）。
 */
'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SpriteBubbleProps = {
  text: string;
  onClose: () => void;
  className?: string;
};

export function SpriteBubble({ text, onClose, className }: SpriteBubbleProps) {
  if (!text) return null;
  return (
    <div
      className={cn(
        'pointer-events-auto rounded-2xl border border-primary/25 bg-background/90 px-4 py-3 shadow-lg backdrop-blur-md',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary/80 shadow-[0_0_0_3px_rgba(99,102,241,0.18)]" />
        <p className="text-sm leading-relaxed text-foreground">{text}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-mr-1 -mt-1 h-8 px-2 text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          关闭
        </Button>
      </div>
    </div>
  );
}
