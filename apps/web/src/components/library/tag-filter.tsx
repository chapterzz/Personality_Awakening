/**
 * 科普图书馆标签 Chips：同步 URL `?tag=`（F-A）。
 */
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { buildLibraryListQuery } from '@/lib/library-api';
import type { LibraryCategory } from '@/lib/library-types';
import { cn } from '@/lib/utils';

export function TagFilter(props: { availableTags: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category') as LibraryCategory | null;
  const activeTag = searchParams.get('tag');

  if (props.availableTags.length === 0) return null;

  function onSelect(tag: string | null) {
    const href = `/library${buildLibraryListQuery({
      category: activeCategory,
      tag: tag ?? undefined,
    })}`;
    router.push(href);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">按标签筛选</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            !activeTag
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted',
          )}
          onClick={() => onSelect(null)}
        >
          全部标签
        </button>
        {props.availableTags.map((tag) => (
          <button
            key={tag}
            type="button"
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              activeTag === tag
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted',
            )}
            onClick={() => onSelect(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
