/**
 * 科普图书馆分类 Tab：同步 URL `?category=`（F-A）。
 */
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { buildLibraryListQuery } from '@/lib/library-api';
import { LIBRARY_CATEGORY_TABS } from '@/lib/library-labels';
import type { LibraryCategory } from '@/lib/library-types';
import { cn } from '@/lib/utils';

export function CategoryTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category') as LibraryCategory | null;
  const activeTag = searchParams.get('tag');

  function onSelect(category: LibraryCategory | null) {
    const href = `/library${buildLibraryListQuery({
      category: category ?? undefined,
      tag: activeTag,
    })}`;
    router.push(href);
  }

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="文章分类">
      {LIBRARY_CATEGORY_TABS.map((tab) => {
        const isActive = tab.value === null ? !activeCategory : activeCategory === tab.value;
        return (
          <button
            key={tab.label}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={cn(
              'rounded-full border-[2px] px-4 py-1.5 text-sm font-semibold transition-colors',
              isActive
                ? 'border-primary bg-primary text-primary-foreground shadow-clay'
                : 'border-border bg-card text-muted-foreground hover:text-foreground',
            )}
            onClick={() => onSelect(tab.value)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
