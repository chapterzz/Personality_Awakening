/**
 * Admin CMS 导出入口：下拉选择 JSON / CSV 格式并触发下载。
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ExportFormat = 'json' | 'csv';

type CmsExportDropdownProps = {
  label: string;
  formats: ExportFormat[];
  onExport: (format: ExportFormat) => void | Promise<void>;
  size?: 'sm' | 'default';
  disabled?: boolean;
};

const FORMAT_LABELS: Record<ExportFormat, string> = {
  json: 'JSON',
  csv: 'CSV',
};

/** 导出格式下拉按钮 */
export function CmsExportDropdown({
  label,
  formats,
  onExport,
  size = 'default',
  disabled = false,
}: CmsExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        {label} ▾
      </Button>
      {open ? (
        <div
          className={cn(
            'absolute right-0 z-20 mt-1 min-w-[7rem] overflow-hidden rounded-xl',
            'border-2 border-[var(--border)] bg-card shadow-clay-sm',
          )}
        >
          {formats.map((format) => (
            <button
              key={format}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                setOpen(false);
                void onExport(format);
              }}
            >
              {FORMAT_LABELS[format]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type CmsRowExportLinksProps = {
  formats: ExportFormat[];
  onExport: (format: ExportFormat) => void | Promise<void>;
};

/** 表格行内导出链接（JSON | CSV） */
export function CmsRowExportLinks({ formats, onExport }: CmsRowExportLinksProps) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {formats.map((format, index) => (
        <span key={format} className="inline-flex items-center gap-1">
          {index > 0 ? <span className="text-muted-foreground">|</span> : null}
          <button
            type="button"
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            onClick={() => void onExport(format)}
          >
            {FORMAT_LABELS[format]}
          </button>
        </span>
      ))}
    </span>
  );
}
