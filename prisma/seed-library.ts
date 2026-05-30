/**
 * 科普图书馆 Seed：仅保留 docs/About MBTI.md 一篇已发布文章。
 * 运行：pnpm db:seed:library
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const REPO_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ABOUT_MBTI_PATH = join(REPO_ROOT, 'docs', 'About MBTI.md');
const ARTICLE_SLUG = 'about-mbti';

/**
 * 从 About MBTI.md 解析标题、摘要与正文。
 */
function loadAboutMbtiArticle(): { title: string; excerpt: string; bodyMd: string } {
  const raw = readFileSync(ABOUT_MBTI_PATH, 'utf8');
  const lines = raw.split(/\r?\n/);
  const bodyLines = [...lines];

  if (bodyLines[0]?.startsWith('关于MBTI')) {
    bodyLines[0] = '# 关于 MBTI';
  }

  const bodyMd = bodyLines.join('\n').trim();
  const excerpt =
    'MBTI 科学依据薄弱，不宜当作了解自己或他人的唯一标准。本文说明常见误区与更科学的大五人格视角。';

  return { title: '关于 MBTI', excerpt, bodyMd };
}

/**
 * 写入唯一科普文章并清理其它演示数据。
 */
async function seedLibraryArticles(): Promise<void> {
  const { title, excerpt, bodyMd } = loadAboutMbtiArticle();
  const publishedAt = new Date('2026-05-01T08:00:00Z');

  await prisma.libraryArticle.deleteMany({ where: { slug: { not: ARTICLE_SLUG } } });

  await prisma.libraryArticle.upsert({
    where: { slug: ARTICLE_SLUG },
    create: {
      title,
      slug: ARTICLE_SLUG,
      excerpt,
      category: 'theory',
      tags: [],
      bodyMd,
      isPublished: true,
      publishedAt,
    },
    update: {
      title,
      excerpt,
      category: 'theory',
      tags: [],
      bodyMd,
      isPublished: true,
      publishedAt,
    },
  });

  console.log(`Seeded library article "${ARTICLE_SLUG}" from docs/About MBTI.md`);
}

seedLibraryArticles()
  .catch((e) => {
    console.error('Library seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
