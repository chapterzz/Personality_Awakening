/**
 * Admin 新建科普文章页（T4.8）。
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LibraryArticleForm,
  parseTagsInput,
  type LibraryArticleFormValues,
} from '@/components/admin/library-article-form';
import { buttonVariants } from '@/components/ui/button';
import { createAdminLibraryArticle } from '@/lib/admin-library-api';
import { cn } from '@/lib/utils';

const EMPTY_FORM: LibraryArticleFormValues = {
  title: '',
  slug: '',
  category: 'theory',
  tags: '',
  excerpt: '',
  bodyMd: '',
};

export default function AdminNewLibraryArticlePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(values: LibraryArticleFormValues) {
    setPending(true);
    setError(null);
    try {
      const created = await createAdminLibraryArticle({
        title: values.title.trim(),
        slug: values.slug.trim(),
        bodyMd: values.bodyMd,
        excerpt: values.excerpt.trim() || null,
        category: values.category,
        tags: parseTagsInput(values.tags),
      });
      router.push(`/admin/library/articles/${encodeURIComponent(created.id)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'create_failed');
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">新建科普文章</h2>
        <Link
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          href="/admin/library/articles"
        >
          返回列表
        </Link>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm">
          创建失败：{error}
        </p>
      ) : null}

      <LibraryArticleForm
        initial={EMPTY_FORM}
        submitLabel="创建草稿"
        pending={pending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
