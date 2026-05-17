/**
 * 科普图书馆文章卡片单测（T4.1）。
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ArticleCard } from '@/components/library/article-card';

const mockArticle = {
  id: '1',
  title: 'MBTI 是什么？',
  slug: 'mbti-basics',
  excerpt: '入门介绍',
  category: 'theory' as const,
  tags: ['MBTI', '基础'],
  published_at: '2026-05-01T08:00:00.000Z',
};

describe('ArticleCard', () => {
  it('渲染标题、分类中文名与首个标签', () => {
    render(<ArticleCard article={mockArticle} />);
    expect(screen.getByRole('heading', { name: 'MBTI 是什么？' })).toBeInTheDocument();
    expect(screen.getByText('基础理论')).toBeInTheDocument();
    expect(screen.getByText('MBTI')).toBeInTheDocument();
  });
});
