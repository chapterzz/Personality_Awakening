/**
 * 科普图书馆列表页：分类 Tab + 标签 Chips + 文章网格（T4.1）。
 */
'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { ArticleCard } from '@/components/library/article-card';
import { CategoryTabs } from '@/components/library/category-tabs';
import { LibraryHero } from '@/components/library/library-hero';
import { TagFilter } from '@/components/library/tag-filter';
import { buttonVariants } from '@/components/ui/button';
import { fetchLibraryArticles } from '@/lib/library-api';
import type { LibraryArticleListData } from '@/lib/library-types';
import { cn } from '@/lib/utils';

function LibraryListContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category') ?? undefined;
  const tag = searchParams.get('tag') ?? undefined;

  const [data, setData] = useState<LibraryArticleListData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchLibraryArticles({ category, tag })
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [category, tag]);

  if (error) {
    return (
      <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-950 dark:text-red-100">
        加载文章失败：{error}
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">正在加载文章…</p>;
  }

  const articles = data?.articles ?? [];
  const listQuery = { category: category ?? null, tag: tag ?? null };

  return (
    <div className="flex flex-col gap-6">
      <CategoryTabs />
      <TagFilter availableTags={data?.available_tags ?? []} />
      {articles.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-muted/30 px-6 py-12">
          <p className="text-center text-sm text-muted-foreground">暂无文章，敬请期待 ✨</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} listQuery={listQuery} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LibraryPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <Link
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex w-fit')}
        href="/"
      >
        返回首页
      </Link>
      <LibraryHero />
      <Suspense fallback={<p className="text-sm text-muted-foreground">正在加载筛选…</p>}>
        <LibraryListContent />
      </Suspense>
    </div>
  );
}
