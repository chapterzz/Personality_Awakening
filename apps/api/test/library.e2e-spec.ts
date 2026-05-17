/**
 * `/library` API 集成测试（T4.1）：公开列表/详情、404 与查询校验。
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { setupOpenApi } from '../src/openapi.setup';
import { PrismaService } from '../src/prisma/prisma.service';

jest.setTimeout(30_000);

const E2E_SLUG_PREFIX = 'e2e-library-';

/** 清理本套件写入的图书馆文章 */
async function cleanupLibraryE2E(prisma: PrismaService): Promise<void> {
  await prisma.libraryArticle.deleteMany({
    where: { slug: { startsWith: E2E_SLUG_PREFIX } },
  });
}

describe('Library API (T4.1)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    setupOpenApi(app);
    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await cleanupLibraryE2E(prisma);
  });

  it('GET /library/articles returns published only', async () => {
    const suffix = randomUUID().slice(0, 8);
    const publishedSlug = `${E2E_SLUG_PREFIX}pub-${suffix}`;
    const draftSlug = `${E2E_SLUG_PREFIX}draft-${suffix}`;

    await prisma.libraryArticle.createMany({
      data: [
        {
          title: 'E2E 已发布',
          slug: publishedSlug,
          bodyMd: '# 正文',
          excerpt: '摘要',
          category: 'theory',
          tags: ['MBTI', 'E2E'],
          isPublished: true,
          publishedAt: new Date(),
        },
        {
          title: 'E2E 草稿',
          slug: draftSlug,
          bodyMd: '# 草稿',
          category: 'theory',
          tags: ['草稿'],
          isPublished: false,
          publishedAt: null,
        },
      ],
    });

    const res = await request(app.getHttpServer()).get('/library/articles').expect(200);

    expect(res.body.success).toBe(true);
    const slugs = (res.body.data.articles as Array<{ slug: string }>).map((a) => a.slug);
    expect(slugs).toContain(publishedSlug);
    expect(slugs).not.toContain(draftSlug);
    expect(res.body.data.articles[0]).not.toHaveProperty('body_md');
    expect(Array.isArray(res.body.data.available_tags)).toBe(true);
  });

  it('GET /library/articles?category=theory&tag=MBTI filters with AND', async () => {
    const suffix = randomUUID().slice(0, 8);
    await prisma.libraryArticle.createMany({
      data: [
        {
          title: '理论+MBTI',
          slug: `${E2E_SLUG_PREFIX}t-mbti-${suffix}`,
          bodyMd: '# a',
          category: 'theory',
          tags: ['MBTI'],
          isPublished: true,
          publishedAt: new Date(),
        },
        {
          title: '名人+MBTI',
          slug: `${E2E_SLUG_PREFIX}c-mbti-${suffix}`,
          bodyMd: '# b',
          category: 'celebrity',
          tags: ['MBTI'],
          isPublished: true,
          publishedAt: new Date(),
        },
      ],
    });

    const res = await request(app.getHttpServer())
      .get('/library/articles')
      .query({ category: 'theory', tag: 'MBTI' })
      .expect(200);

    const slugs = (res.body.data.articles as Array<{ slug: string }>).map((a) => a.slug);
    expect(slugs).toContain(`${E2E_SLUG_PREFIX}t-mbti-${suffix}`);
    expect(slugs).not.toContain(`${E2E_SLUG_PREFIX}c-mbti-${suffix}`);
  });

  it('GET /library/articles invalid category → 400', async () => {
    await request(app.getHttpServer())
      .get('/library/articles')
      .query({ category: 'invalid_cat' })
      .expect(400);
  });

  it('GET /library/articles/:slug returns detail with body_md', async () => {
    const suffix = randomUUID().slice(0, 8);
    const slug = `${E2E_SLUG_PREFIX}detail-${suffix}`;
    await prisma.libraryArticle.create({
      data: {
        title: '详情文',
        slug,
        bodyMd: '## 小节\n\n段落',
        category: 'anti_label',
        tags: ['反标签'],
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    const res = await request(app.getHttpServer()).get(`/library/articles/${slug}`).expect(200);

    expect(res.body.data.slug).toBe(slug);
    expect(res.body.data.body_md).toContain('小节');
  });

  it('GET /library/articles/:slug 404 for unknown', async () => {
    await request(app.getHttpServer()).get('/library/articles/no-such-slug-e2e').expect(404);
  });

  it('GET /library/articles/:slug 404 for unpublished', async () => {
    const suffix = randomUUID().slice(0, 8);
    const slug = `${E2E_SLUG_PREFIX}unpub-${suffix}`;
    await prisma.libraryArticle.create({
      data: {
        title: '未发布',
        slug,
        bodyMd: '# x',
        category: 'theory',
        isPublished: false,
        publishedAt: null,
      },
    });

    await request(app.getHttpServer()).get(`/library/articles/${slug}`).expect(404);
  });
});
