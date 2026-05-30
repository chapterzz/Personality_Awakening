/**
 * 科普图书馆列表卡片：标题与摘要（无分类/标签）。
 */
import Link from 'next/link';

import type { LibraryArticleSummary } from '@/lib/library-types';
import { cn } from '@/lib/utils';

export function ArticleCard(props: { article: LibraryArticleSummary }) {
  const { article } = props;
  const href = `/library/${article.slug}`;

  return (
    <Link
      href={href}
      className={cn(
        'clay-card flex flex-col gap-3 bg-card p-5 transition-transform hover:-translate-y-0.5',
      )}
    >
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
