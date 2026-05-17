/**
 * 科普图书馆 Markdown 正文：react-markdown + remark-gfm，R-A 窄栏 prose（T4.1）。
 */
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ArticleBody(props: { markdown: string }) {
  return (
    <article className="library-prose prose-neutral dark:prose-invert max-w-3xl">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{props.markdown}</ReactMarkdown>
    </article>
  );
}
