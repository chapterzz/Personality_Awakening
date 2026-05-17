/**
 * T4.1 科普图书馆演示 Seed：写入 ≥6 篇已发布文章（三分类 + 多标签），含 1 篇未发布草稿。
 * 运行方式：pnpm db:seed:library
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedArticle = {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  bodyMd: string;
  isPublished: boolean;
  publishedAt: Date | null;
};

const ARTICLES: SeedArticle[] = [
  {
    title: 'MBTI 是什么？',
    slug: 'mbti-basics',
    excerpt: '用通俗语言认识四组人格维度，适合第一次接触性格类型理论的同学。',
    category: 'theory',
    tags: ['MBTI', '基础'],
    bodyMd: `## 什么是 MBTI

MBTI（迈尔斯-布里格斯类型指标）用四个维度描述人们偏好的心理功能：

- **E / I**：精力来自外界互动还是内心独处
- **S / N**：更关注具体事实还是抽象可能
- **T / F**：决策时更倚重逻辑还是价值观
- **J / P**：生活方式更倾向计划还是灵活

> 类型标签是描述偏好，不是能力高低。

## 怎么用好测评结果

把它当作了解自己的**起点**，而不是贴在身上的固定标签。`,
    isPublished: true,
    publishedAt: new Date('2026-05-01T08:00:00Z'),
  },
  {
    title: '四个维度怎么理解',
    slug: 'four-dimensions',
    excerpt: 'E/I、S/N、T/F、J/P 各代表什么？结合校园场景举例说明。',
    category: 'theory',
    tags: ['MBTI', '维度'],
    bodyMd: `## 维度不是非黑即白

每个维度都是连续谱，测评给出的是**当前偏好侧**，程度有深有浅。

### 课堂上的例子

- 小组讨论很投入 → 可能偏 **E**
- 喜欢先想清楚再发言 → 可能偏 **I**

请把结果当作「我更常这样」，而不是「我只能这样」。`,
    isPublished: true,
    publishedAt: new Date('2026-05-02T08:00:00Z'),
  },
  {
    title: '警惕「标签效应」',
    slug: 'anti-label-effect',
    excerpt: '为什么不宜用四个字母定义一个人？反标签视角的心理学科普。',
    category: 'anti_label',
    tags: ['反标签', '科普'],
    bodyMd: `## 标签效应是什么

当人们相信某个标签（例如「我是 INFP」）时，可能无意识地按标签行事，这叫**自我实现预言**。

## 我们可以怎么做

1. 用描述性语言代替绝对化标签
2. 关注具体行为，而非类型全称
3. 允许自己在不同情境下有不同表现`,
    isPublished: true,
    publishedAt: new Date('2026-05-03T08:00:00Z'),
  },
  {
    title: '测评信度与常见误区',
    slug: 'stereotype-myth',
    excerpt: '网上流传的「某类型一定怎样」靠谱吗？聊聊信度与刻板印象。',
    category: 'anti_label',
    tags: ['信度', '误区'],
    bodyMd: `## 信度指什么

同一份问卷在相近条件下**结果是否稳定**。娱乐向短测往往信度有限。

## 常见误区

- 「T 型一定冷血」—— 错，T 只是决策时更常参考逻辑
- 「P 型一定拖延」—— 错，P 只是更偏好保持选项开放`,
    isPublished: true,
    publishedAt: new Date('2026-05-04T08:00:00Z'),
  },
  {
    title: '名人 INFP 案例（娱乐向）',
    slug: 'celebrity-infp-demo',
    excerpt: '从公开报道看 INFP 特质，仅供趣味讨论，非心理诊断。',
    category: 'celebrity',
    tags: ['名人', 'INFP'],
    bodyMd: `## 说明

以下内容为**娱乐向整理**，不代表真实临床评估。

> 内容仅供科普与娱乐参考，不能替代专业心理评估或医疗诊断。

许多创作者被粉丝称为 INFP，往往因为他们表达细腻、重视内在价值—— 这提醒我们：**类型是透镜，不是笼子**。`,
    isPublished: true,
    publishedAt: new Date('2026-05-05T08:00:00Z'),
  },
  {
    title: '名人 ENTP 案例（娱乐向）',
    slug: 'celebrity-entp-story',
    excerpt: '好奇、辩论、点子多——用案例聊聊 ENTP 气质，保持轻松心态阅读。',
    category: 'celebrity',
    tags: ['名人', 'ENTP'],
    bodyMd: `## 娱乐参考

ENTP 常被描述为「点子多、喜欢挑战假设」。在名人故事里，这类气质常与创新、脱口秀式表达联系在一起。

请记住：**名人没有义务符合任何类型描述**。`,
    isPublished: true,
    publishedAt: new Date('2026-05-06T08:00:00Z'),
  },
  {
    title: '使用本平台内容的伦理说明',
    slug: 'ethics-disclaimer',
    excerpt: '测评与科普内容的适用范围、隐私与求助渠道说明。',
    category: 'theory',
    tags: ['伦理', '免责声明'],
    bodyMd: `## 重要声明

> **内容仅供科普与娱乐参考，不能替代专业心理评估或医疗诊断。**

若你感到持续的情绪困扰，请向学校心理老师、家长或专业机构求助。

## 我们承诺

- 不将测评结果用于升学甄别
- 不公开可识别个人的明细数据`,
    isPublished: true,
    publishedAt: new Date('2026-05-07T08:00:00Z'),
  },
  {
    title: '【草稿】未发布示例',
    slug: 'draft-unpublished-demo',
    excerpt: '此篇仅用于验证未发布文章不出现在学生端列表。',
    category: 'theory',
    tags: ['草稿'],
    bodyMd: '# 草稿\n\n学生端不可见。',
    isPublished: false,
    publishedAt: null,
  },
];

/**
 * 按 slug upsert 演示文章。
 */
async function seedLibraryArticles(): Promise<void> {
  let count = 0;
  for (const article of ARTICLES) {
    await prisma.libraryArticle.upsert({
      where: { slug: article.slug },
      create: article,
      update: article,
    });
    if (article.isPublished) count += 1;
  }
  console.log(
    `Seeded ${ARTICLES.length} library article(s) (${count} published, ${ARTICLES.length - count} draft).`,
  );
}

seedLibraryArticles()
  .catch((e) => {
    console.error('Library seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
