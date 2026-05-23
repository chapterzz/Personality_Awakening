/**
 * 标题 → 建议 slug 单测（T4.8）。
 */
import { suggestSlugFromTitle } from '@/lib/library-slug';

describe('suggestSlugFromTitle', () => {
  it('converts English title to kebab-case', () => {
    expect(suggestSlugFromTitle('MBTI Basics Guide')).toBe('mbti-basics-guide');
  });

  it('replaces spaces with hyphens', () => {
    expect(suggestSlugFromTitle('hello world')).toBe('hello-world');
  });

  it('strips special characters', () => {
    expect(suggestSlugFromTitle('What is MBTI?')).toBe('what-is-mbti');
  });

  it('preserves Chinese characters', () => {
    expect(suggestSlugFromTitle('什么是 MBTI')).toBe('什么是-mbti');
  });

  it('trims and collapses hyphens', () => {
    expect(suggestSlugFromTitle('  foo---bar  ')).toBe('foo-bar');
  });
});
