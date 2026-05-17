/**
 * 科普图书馆列表卡片：标题、摘要、分类徽章与首个标签（T4.1）。
 */
import Link from 'next/link';

import { buildLibraryListQuery } from '@/lib/library-api';
import { getCategoryLabel } from '@/lib/library-labels';
import type { LibraryArticleSummary } from '@/lib/library-types';
import { cn } from '@/lib/utils';

export function ArticleCard(props: {
  article: LibraryArticleSummary;
  listQuery?: { category?: string | null; tag?: string | null };
}) {
  const { article } = props;
  const firstTag = article.tags[0];
  const href = `/library/${article.slug}${buildLibraryListQuery(props.listQuery ?? {})}`;

  return (
    <Link
      href={href}
      className={cn(
        'clay-card flex flex-col gap-3 bg-card p-5 transition-transform hover:-translate-y-0.5',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {getCategoryLabel(article.category)}
        </span>
        {firstTag ? (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
            {firstTag}
          </span>
        ) : null}
      </div>
      <h2 className="font-display text-lg font-bold text-foreground">{article.title}</h2>
      {article.excerpt ? (
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {article.excerpt}
        </p>
      ) : null}
      <span className="text-xs font-medium text-primary">阅读全文 →</span>
    </Link>
  );
}
