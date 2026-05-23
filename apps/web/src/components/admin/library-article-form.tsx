/**
 * Admin 科普文章编辑表单：Markdown 文本域与可选预览（T4.8）。
 */
'use client';

import { useState } from 'react';
import { ArticleBody } from '@/components/library/article-body';
import { buttonVariants } from '@/components/ui/button';
import { LIBRARY_CATEGORY_TABS } from '@/lib/library-labels';
import { suggestSlugFromTitle } from '@/lib/library-slug';
import { cn } from '@/lib/utils';

export type LibraryArticleFormValues = {
  title: string;
  slug: string;
  category: string;
  tags: string;
  excerpt: string;
  bodyMd: string;
};

type LibraryArticleFormProps = {
  initial: LibraryArticleFormValues;
  submitLabel: string;
  pending?: boolean;
  slugEditable?: boolean;
  onSubmit: (values: LibraryArticleFormValues) => Promise<void>;
};

const CATEGORY_OPTIONS = LIBRARY_CATEGORY_TABS.filter((t) => t.value !== null);

/**
 * 科普文章表单：标题、slug、分类、标签、摘要、Markdown 正文与预览 Tab。
 */
export function LibraryArticleForm({
  initial,
  submitLabel,
  pending = false,
  slugEditable = true,
  onSubmit,
}: LibraryArticleFormProps) {
  const [values, setValues] = useState(initial);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [slugTouched, setSlugTouched] = useState(false);

  function updateField<K extends keyof LibraryArticleFormValues>(
    key: K,
    value: LibraryArticleFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleTitleBlur() {
    if (!slugTouched && slugEditable && !values.slug.trim()) {
      updateField('slug', suggestSlugFromTitle(values.title));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(values);
  }

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-semibold">标题</span>
          <input
            className="w-full rounded-xl border-2 border-[var(--border)] bg-background px-3 py-2"
            value={values.title}
            onChange={(e) => updateField('title', e.target.value)}
            onBlur={handleTitleBlur}
            required
            maxLength={120}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-semibold">Slug（URL 路径）</span>
          <input
            className="w-full rounded-xl border-2 border-[var(--border)] bg-background px-3 py-2 font-mono text-xs"
            value={values.slug}
            onChange={(e) => {
              setSlugTouched(true);
              updateField('slug', e.target.value);
            }}
            onBlur={() => setSlugTouched(true)}
            required
            disabled={!slugEditable}
            placeholder="mbti-basics"
          />
          <span className="text-xs text-muted-foreground">
            小写、连字符；发布后修改会导致旧链接失效
          </span>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-semibold">分类</span>
          <select
            className="w-full rounded-xl border-2 border-[var(--border)] bg-background px-3 py-2"
            value={values.category}
            onChange={(e) => updateField('category', e.target.value)}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value!}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-semibold">标签（逗号分隔）</span>
          <input
            className="w-full rounded-xl border-2 border-[var(--border)] bg-background px-3 py-2"
            value={values.tags}
            onChange={(e) => updateField('tags', e.target.value)}
            placeholder="MBTI, 入门"
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-semibold">摘要（可选，列表展示）</span>
        <textarea
          className="min-h-[80px] w-full rounded-xl border-2 border-[var(--border)] bg-background px-3 py-2"
          value={values.excerpt}
          onChange={(e) => updateField('excerpt', e.target.value)}
          maxLength={300}
        />
      </label>

      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: tab === 'edit' ? 'default' : 'outline', size: 'sm' }),
            )}
            onClick={() => setTab('edit')}
          >
            编辑 Markdown
          </button>
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: tab === 'preview' ? 'default' : 'outline', size: 'sm' }),
            )}
            onClick={() => setTab('preview')}
          >
            预览
          </button>
        </div>
        {tab === 'edit' ? (
          <textarea
            className="min-h-[320px] w-full rounded-xl border-2 border-[var(--border)] bg-background px-3 py-2 font-mono text-sm"
            value={values.bodyMd}
            onChange={(e) => updateField('bodyMd', e.target.value)}
            required
            placeholder="# 标题&#10;&#10;正文内容…"
          />
        ) : (
          <div className="rounded-xl border-2 border-[var(--border)] bg-card p-4">
            {values.bodyMd.trim() ? (
              <ArticleBody markdown={values.bodyMd} />
            ) : (
              <p className="text-sm text-muted-foreground">暂无正文可预览</p>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className={cn(buttonVariants({ variant: 'default' }), 'w-full sm:w-auto')}
      >
        {pending ? '保存中…' : submitLabel}
      </button>
    </form>
  );
}

/** 将逗号分隔标签字符串解析为数组 */
export function parseTagsInput(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}
