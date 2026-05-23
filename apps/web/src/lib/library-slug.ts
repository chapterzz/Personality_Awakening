/**
 * 从中文/英文标题生成建议 slug（小写 kebab-case，T4.8）。
 */

/**
 * 从标题生成建议 slug：trim、小写、空格转连字符、去除非法字符、最长 80。
 */
export function suggestSlugFromTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fff-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}
