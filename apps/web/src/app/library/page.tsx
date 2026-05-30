/**
 * 科普图书馆：单篇《关于 MBTI》导读，进入后直达文章详情。
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { LibraryHero } from '@/components/library/library-hero';
import { buttonVariants } from '@/components/ui/button';
import { fetchLibraryArticles } from '@/lib/library-api';
import { cn } from '@/lib/utils';

export default function LibraryPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLibraryArticles()
      .then((data) => {
        if (cancelled) return;
        const article = data.articles[0];
        if (article) {
          router.replace(`/library/${article.slug}`);
          return;
        }
        setError('暂无已发布文章');
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载失败');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <Link
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex w-fit')}
        href="/"
      >
        返回首页
      </Link>
      <LibraryHero />
      {error ? (
        <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-950 dark:text-red-100">
          {error}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">正在打开文章…</p>
      )}
    </div>
  );
}
