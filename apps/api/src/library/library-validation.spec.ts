/**
 * 科普图书馆文章字段校验单测（T4.8）。
 */
import {
  normalizeTags,
  validateArticleForPublish,
  validateCategory,
  validateSlug,
} from './library-validation';

describe('validateSlug', () => {
  it('accepts kebab-case slug', () => {
    expect(validateSlug('mbti-basics')).toEqual({ ok: true });
  });

  it('rejects uppercase', () => {
    expect(validateSlug('MBTI-Basics').ok).toBe(false);
  });

  it('rejects empty', () => {
    expect(validateSlug('').ok).toBe(false);
  });

  it('rejects single character', () => {
    expect(validateSlug('a').ok).toBe(false);
  });
});

describe('normalizeTags', () => {
  it('trims, deduplicates and caps at 10', () => {
    const raw = [' MBTI ', 'MBTI', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    expect(normalizeTags(raw)).toEqual(['MBTI', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']);
  });

  it('drops empty tags', () => {
    expect(normalizeTags(['', '  ', 'valid'])).toEqual(['valid']);
  });
});

describe('validateCategory', () => {
  it('accepts theory', () => {
    expect(validateCategory('theory')).toBe(true);
  });

  it('rejects unknown category', () => {
    expect(validateCategory('video')).toBe(false);
  });
});

describe('validateArticleForPublish', () => {
  const valid = {
    title: '测试标题',
    slug: 'test-slug',
    bodyMd: '至少十个字符的正文内容。',
    category: 'theory',
  };

  it('accepts valid article', () => {
    expect(validateArticleForPublish(valid)).toEqual({ ok: true });
  });

  it('rejects empty title', () => {
    expect(validateArticleForPublish({ ...valid, title: '  ' }).ok).toBe(false);
  });

  it('rejects short body', () => {
    expect(validateArticleForPublish({ ...valid, bodyMd: 'short' }).ok).toBe(false);
  });

  it('rejects invalid category', () => {
    expect(validateArticleForPublish({ ...valid, category: 'bad' }).ok).toBe(false);
  });
});
