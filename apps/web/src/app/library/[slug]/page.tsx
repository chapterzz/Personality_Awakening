/**
 * 科普图书馆文章详情页：Markdown 正文 + 免责声明（T4.1 R-A 窄栏）。
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { ArticleBody } from '@/components/library/article-body';
import { buttonVariants } from '@/components/ui/button';
import { fetchLibraryArticleBySlug } from '@/lib/library-api';
import { LIBRARY_ETHICS_DISCLAIMER } from '@/lib/library-labels';
import type { LibraryArticleDetail } from '@/lib/library-types';
import { cn } from '@/lib/utils';

export default function LibraryArticlePage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  const [article, setArticle] = useState<LibraryArticleDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    fetchLibraryArticleBySlug(slug)
      .then(setArticle)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">正在加载文章…</p>;
  }

  if (error || !article) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Link
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex w-fit')}
          href="/"
        >
          返回首页
        </Link>
        <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-950 dark:text-red-100">
          {error?.includes('404') ? '文章不存在或未发布。' : `加载失败：${error}`}
        </p>
      </div>
    );
  }

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <Link
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex w-fit')}
        href="/"
      >
        返回首页
      </Link>
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          {article.title}
        </h1>
      </header>
      <ArticleBody markdown={article.body_md} />
      <footer className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
        {LIBRARY_ETHICS_DISCLAIMER}
      </footer>
    </article>
  );
}
