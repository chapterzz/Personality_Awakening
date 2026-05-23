/**
 * Admin 科普图书馆 CMS 集成测试（T4.8）：角色守卫、CRUD、发布/下架与公开 GET 一致性。
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { setupOpenApi } from '../src/openapi.setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtUserService } from '../src/auth/jwt-user.service';

const E2E_LIB_PREFIX = 'e2e-admin-lib-';

jest.setTimeout(30_000);

describe('Admin Library CMS API (T4.8)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtUser: JwtUserService;
  let adminToken: string;
  let studentToken: string;
  let adminUserId: string;
  let studentUserId: string;

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
    jwtUser = app.get(JwtUserService);
    await app.init();

    const suffix = randomUUID().slice(0, 8);
    const adminNickname = `${E2E_LIB_PREFIX}admin-${suffix}`;
    const studentNickname = `${E2E_LIB_PREFIX}student-${suffix}`;
    const passwordHash = await bcrypt.hash('test-pass-12345678', 10);

    const admin = await prisma.user.create({
      data: { nickname: adminNickname, passwordHash, role: UserRole.ADMIN },
    });
    const student = await prisma.user.create({
      data: { nickname: studentNickname, passwordHash, role: UserRole.STUDENT },
    });
    adminUserId = admin.id;
    studentUserId = student.id;
    adminToken = jwtUser.signAccessTokenForTests(adminUserId, 'ADMIN');
    studentToken = jwtUser.signAccessTokenForTests(studentUserId, 'STUDENT');
  });

  afterAll(async () => {
    await prisma.libraryArticle.deleteMany({
      where: { slug: { startsWith: E2E_LIB_PREFIX } },
    });
    await prisma.user.deleteMany({
      where: { nickname: { startsWith: E2E_LIB_PREFIX } },
    });
    await app.close();
  });

  it('GET /admin/library/articles：无 token → 401', async () => {
    await request(app.getHttpServer()).get('/admin/library/articles').expect(401);
  });

  it('GET /admin/library/articles：STUDENT → 403', async () => {
    await request(app.getHttpServer())
      .get('/admin/library/articles')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);
  });

  it('CRUD + 发布/下架：公开 GET 与 isPublished 一致', async () => {
    const slug = `${E2E_LIB_PREFIX}${randomUUID().slice(0, 8)}`;

    const createRes = await request(app.getHttpServer())
      .post('/admin/library/articles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'E2E 科普文章',
        slug,
        bodyMd: '这是一篇用于集成测试的 Markdown 正文，长度足够。',
        category: 'theory',
        tags: ['MBTI', '测试'],
        excerpt: 'E2E 摘要',
      })
      .expect(201);

    const articleId = createRes.body.data.id as string;
    expect(createRes.body.data.isPublished).toBe(false);

    await request(app.getHttpServer()).get(`/library/articles/${slug}`).expect(404);

    await request(app.getHttpServer())
      .post(`/admin/library/articles/${articleId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const listRes = await request(app.getHttpServer()).get('/library/articles').expect(200);
    const slugs = (listRes.body.data.articles as Array<{ slug: string }>).map((a) => a.slug);
    expect(slugs).toContain(slug);

    const detailRes = await request(app.getHttpServer())
      .get(`/library/articles/${slug}`)
      .expect(200);
    expect(detailRes.body.data.title).toBe('E2E 科普文章');

    await request(app.getHttpServer())
      .post(`/admin/library/articles/${articleId}/unpublish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    await request(app.getHttpServer()).get(`/library/articles/${slug}`).expect(404);
  });

  it('POST 重复 slug → 409', async () => {
    const slug = `${E2E_LIB_PREFIX}dup-${randomUUID().slice(0, 8)}`;
    const payload = {
      title: '重复 slug 测试',
      slug,
      bodyMd: '正文内容足够长用于创建草稿测试。',
      category: 'theory',
    };

    await request(app.getHttpServer())
      .post('/admin/library/articles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);

    const dup = await request(app.getHttpServer())
      .post('/admin/library/articles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...payload, title: '另一标题' })
      .expect(409);
    expect(dup.body.message).toBe('slug_taken');
  });

  it('DELETE 已发布文章 → 409', async () => {
    const slug = `${E2E_LIB_PREFIX}del-${randomUUID().slice(0, 8)}`;

    const createRes = await request(app.getHttpServer())
      .post('/admin/library/articles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: '待删已发布',
        slug,
        bodyMd: '正文内容足够长用于删除测试场景验证。',
        category: 'theory',
      })
      .expect(201);

    const articleId = createRes.body.data.id as string;

    await request(app.getHttpServer())
      .post(`/admin/library/articles/${articleId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const delRes = await request(app.getHttpServer())
      .delete(`/admin/library/articles/${articleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(409);
    expect(delRes.body.message).toBe('article_still_published');

    await request(app.getHttpServer())
      .post(`/admin/library/articles/${articleId}/unpublish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/admin/library/articles/${articleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});
