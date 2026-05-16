# 技术开发说明书 - 性格星球 (v4.0)

## 1. 技术栈选型 (Tech Stack)
| 层级 | 技术 | 理由 |
| :--- | :--- | :--- |
| **前端框架** | **Next.js 14 (App Router)** | SSR 优化首屏，SEO 友好，React 生态强大 |
| **样式方案** | **TailwindCSS + Shadcn/UI** | 快速构建响应式 UI，内置深色模式支持 |
| **状态管理** | **Zustand** | 轻量级，适合管理测试进度和用户状态 |
| **服务端框架** | **NestJS** | 模块化，TypeScript 原生，适合复杂业务逻辑 |
| **数据库** | **PostgreSQL** | 稳定可靠，支持 JSONB 存储测试结果 |
| **ORM** | **Prisma** | 类型安全，迁移管理方便 |
| **图表库** | **Recharts** | 数据可视化，支持柱状图、热力图等 |
| **部署** | **Docker + Nginx** | 容器化，便于 CI/CD 和扩容 |
| **CI/CD** | **GitHub Actions** | 自动化测试与部署 |


## 2. 项目目录结构 (Monorepo 建议)
planet-personality/
├── apps/
│ ├── web/ # Next.js 前端
│ │ ├── src/
│ │ │ ├── app/ # 路由 (/(student), /dashboard, /api)
│ │ │ ├── components/ # UI 组件 (ui/, features/, game/)
│ │ │ ├── hooks/ # 自定义 Hooks (useSocket, useTestProgress)
│ │ │ ├── lib/ # 工具 (socket-client, canvas-generator)
│ │ │ └── stores/ # Zustand stores
│ │ └── public/ # 静态资源 (sprites, audio)
│   └── api/ # NestJS 后端
│       └── src/
│           ├── auth/ # 认证模块 (Guest -> User)
│           ├── test/ # 测试逻辑 (Scoring, AVG engine)
│           ├── dashboard/ # 全局洞察看板 (聚合 API)
│           ├── report/ # 报告生成
│           └── common/ # Guards, Filters, Interceptors
├── prisma/ # 仓库根目录：唯一 Prisma 定义处
│ ├── schema.prisma
│ └── migrations/ # prisma migrate 生成
├── docker-compose.yml
├── .env.example
└── package.json


### 2.1 Prisma 约定（仓库根目录）
- **Schema 位置**：`prisma/schema.prisma` 固定在**仓库根目录**，不在 `apps/api` 下。
- **环境变量**：`DATABASE_URL` 写在仓库根目录 `.env`（或 `.env.local`），与在根目录执行 `pnpm prisma` 一致。
- **迁移命令**（在仓库根目录执行）：`pnpm prisma migrate dev`（或 `pnpm prisma generate`）。
- **应用引用**：`apps/api` 安装并导入 `@prisma/client`；monorepo 可在根 `package.json` 配置 `prisma` 脚本或 `postinstall`，保证 Nest 与同一套生成 Client 对齐。


## 3. 核心功能实现指南

### 3.1 全局洞察看板 (REST API)
- **后端**：
  - 新增 `DashboardModule`（`apps/api/src/dashboard/`），包含 `DashboardController` 和 `DashboardService`。
  - **`GET /dashboard/stats`**（公开，无需认证）：用 Prisma `groupBy` 聚合 `TestResult` 表，返回类型分布、精灵热力图矩阵、趣味统计数据。
  - **`GET /dashboard/my-comparison`**（需 JWT）：返回当前用户的人格类型与全局数据的对比。
  - 精灵映射规则与前端 `sprite-profile-card.tsx` 一致：MBTI 首字母 `E` → 曦光领航精灵，`I` → 月影探索精灵。
- **前端**：
  - 新增 `/dashboard` 页面（`apps/web/src/app/dashboard/page.tsx`），公开访问。
  - 组件：`DashboardHero`、`TypeDistributionChart`（Recharts BarChart）、`SpriteHeatmap`（CSS Grid）、`FunInsightCards`、`PersonalComparison`。
  - 数据获取：客户端 `useEffect` + `fetch`，复用 `getBrowserApiBaseUrl()`。
  - 首页 (`/`) 添加”查看全局洞察”入口按钮。

### 3.2 进行中测评进度（TemporarySession，与 PRD 一致）
- **存储**：未完成进度**只**落在 `TemporarySession.progress_data`；`TestResult` 仅在**正式提交**后写入；**`progress_data` 键名与嵌套结构**以 **PRD §2.4** 为准。
- **游客**：`user_id` 为空，用 `session_id`（对应客户端 `temp_session_id`）定位；**注册用户**：`user_id` 非空，登录后以用户身份拉取/保存同一张表（见 PRD §1.1 / §2）。
- **接口约定（snake_case）**：
  - **GET** 进度：响应含 `progress_data`、`progress_revision`、`updated_at`（及 `session_id` 等）。
  - **PUT** 保存：请求体含 **`progress_data`**；另含 **`if_match_revision`**（整数，须与上次 GET 的 `progress_revision` 一致）；成功则服务端递增 `progress_revision` 并返回新值；不匹配返回 **409**，体中带回**最新** `progress_data` 与 `progress_revision`（与 PRD §2.5 一致）。
  - 游客请求须带 `session_id`；注册用户由 JWT 解析 `user_id`，服务端校验会话归属。
- **先注册再测**：创建或复用该用户唯一进行中 `TemporarySession`（`user_id` 唯一约束）。

### 3.3 游客转正式用户 (Data Migration)
- **未完成即注册**：在同一事务内创建 `User`，并将当前 `TemporarySession` **绑定** `user_id`，**保留** `progress_data`；**不**创建 `TestResult`。
- **已完成并提交后注册**（或注册后立即提交）：创建 `User`、写入 `TestResult`、删除或失效对应 `TemporarySession`（与业务规则一致）。
- **事务示例（未完成绑定）**:
  ```typescript
  // Pseudo-code in NestJS
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { nickname, password_hash } });
    await tx.temporarySession.update({
      where: { session_id },
      data: { user_id: user.id },
    });
    return user;
  });
  ```
- **提交终态（示意）**：在评分完成后 `tx.testResult.create({ ... })`，再 `tx.temporarySession.delete({ where: { session_id } })` 或标记失效。

### 3.4 海报生成 (Client-side)
使用 html2canvas 或原生 Canvas API。
确保跨域图片 (CORS) 允许绘制，或使用 Base64 资源。
在 Next.js 中注意 SSR 兼容性（仅在 useEffect 或客户端组件执行）。

### 3.5 隐私与安全
密码: 使用 bcrypt 或 argon2 加密。
匿名化: 数据库不存储真实姓名，昵称自动生成随机后缀 (e.g., "Star#921").
删除: 实现 softDelete 中间件，并提供 cron job 定期物理删除标记为 is_deleted 的数据。

## 4. 开发环境启动步骤

**详细小白向步骤**（含 Docker、连接串说明、排障）：见仓库 **`docs/本地环境调试指南.md`**。下文为摘要。

安装依赖: pnpm install
配置环境变量: 复制 .env.example 到 .env，填写 DB URL, JWT Secret。
启动数据库: docker-compose up -d db（或 `docker compose up -d`，与本地 Docker 版本一致即可）
数据库迁移: 在**仓库根目录**执行 `pnpm prisma migrate dev`（Schema：`prisma/schema.prisma`）
启动服务:
Backend: pnpm dev:api (Port 3001)
Frontend: pnpm dev:web (Port 3000)
访问: http://localhost:3000

**Playwright（首次）**：在仓库根执行 `pnpm test:e2e:install` 安装 Chromium；E2E 使用 `pnpm test:e2e`（配置见根目录 `playwright.config.ts`）。

**文档维护**：每个 Phase 完成后**按需**核对 `docs/本地环境调试指南.md` 是否需增补（新环境变量、新服务、新命令等）；约定见 **`PPA_Development_Task.md` §2.2**。

## 5. 测试策略、全环节单元覆盖与阶段门禁

### 5.1 概念区分（须同时遵守）

| 概念 | 含义 |
| :--- | :--- |
| **小步快跑** | 仅指**研发节奏**：按任务 ID 拆小切片交付，每片结束先跑门禁、修问题再推进下一片。 |
| **测试规划** | 指**类型、工具、矩阵、门禁命令**须在迭代**早期即写全、对齐仓库**（本节与任务书 §2.1）；**不得**以「节奏快」为由推迟补单测直至 Week 6。 |
| **全环节单元覆盖** | 每个任务模块（下表「环节」）在**合并前**须具备对应 **单元测试**（`apps/api`：**Jest**；`apps/web`：**Vitest**）；若该环节主要为编排/HTTP，则**单元 + 集成测试**合并满足「可证明行为正确」即可，但**禁止零测试合代码**。 |

### 5.2 分层与工具（定稿）

| 层级 | 工具 / 位置 | 说明 |
| :--- | :--- | :--- |
| **单元（后端）** | `apps/api`，**Jest** | Service、Guard、纯函数、DTO 校验、与 DB 无关的算法（如 MBTI 计分草稿逻辑）。 |
| **集成（后端）** | `apps/api`，**Jest + supertest** | Controller + 内存/测试库；进度 **409**、Auth、看板 API 等 HTTP 行为。 |
| **单元（前端）** | `apps/web`，**Vitest** + Testing Library（按需） | `src/lib/**` 纯函数、hooks、无 RSC 负担的组件；复杂页面以 E2E + 关键子树单测组合。 |
| **E2E（浏览器）** | 仓库根 **`e2e/`**，**Playwright** | 用户路径与跨端：**注册 → 测评 → 查看看板**（随功能就绪增量加 spec）；CI 默认 **Chromium**，发版前扩展真机矩阵。 |
| **契约 / 文档** | **OpenAPI（Swagger）** | `apps/api`：`/docs`、`/docs-json` 与实现一致。 |

**仓库脚本（根目录）**：`pnpm gate:static`（build + lint + format:check）；`pnpm test:unit`（api 源码 **Jest** + web **Vitest**）；`pnpm test:integration`（api **`test/*.e2e-spec.ts`**，Nest + **supertest**，验证 HTTP/OpenAPI 挂载）；`pnpm test:e2e`（**Playwright**）；**首次 Playwright 前**执行 `pnpm test:e2e:install`。**小切片合并前最低门槛**：`pnpm test:gate`（= `gate:static` + `test:unit` + `test:integration`）；含浏览器多页行为的切片另跑 `pnpm test:e2e`。

### 5.3 环节 — 测试类型矩阵（MVP；随任务扩展用例文件）

「单元」列：**合并前必须新增/更新用例**；「集成」「E2E」列：在该行功能首次落地时**必须**出现对应层级用例（可后续加固）。

| 环节（任务书 ID） | 单元（Jest / Vitest） | 集成（supertest 等） | E2E（Playwright） |
| :--- | :--- | :--- | :--- |
| T1.1 初始化 | web：`src/lib` 纯函数；api：Controller 单元 | **supertest**：`/`、`/health`、`/docs`、`/docs-json` | Playwright：首页 smoke + **API `/health` JSON** |
| T1.2 数据库 | Prisma schema 衍生类型/常量（若有）；迁移后 repository 单测 | 有 DB 后的健康/迁移探测（可选） | — |
| T1.3 Docker | — | compose 健康检查脚本（可选） | — |
| T1.4 会话与进度 | revision 计算、progress_data 校验纯函数 | **GET/PUT 进度、409** | — |
| T1.5 注册/登录 | 密码哈希策略、JWT payload 构造 | **注册/登录/游客转化 API** | — |
| T1.6 基础 UI | 布局/主题：`src/test/home-page.spec.tsx`（关键 class）、纯逻辑 | — | `e2e/smoke`、`e2e/home-layout` |
| T2.1–T2.7 测评引擎 | **计分、题序规则、AVG 节点/分支进度**（如 `avg-branch-progress.spec.ts`）等纯逻辑 | 提交结果、保存进度 API | 标准/AVG 主路径（分段）；AVG UI 见 `e2e/avg-branch-progress` |
| T3.x 全局洞察看板 | 聚合统计纯函数、精灵映射逻辑 | **GET /dashboard/stats**、**GET /dashboard/my-comparison** | **看板页面**渲染与数据准确性 |
| T4.x 内容 / CMS | 校验器、格式化、权限 helper | Admin API | 发布后学生端拉取（关键流） |
| T5.x 收口 | 与缺陷修复同步补回归单测 | 安全敏感 API | **T5.2 全链路 100% 通过** |

### 5.4 阶段门禁（与「小步快跑」配合）

1. **每个小切片合并前（始终）**：`pnpm test:gate`（= `gate:static` + `test:unit` + **`test:integration`**（api HTTP 集成））。  
2. **涉及 UI 路由或跨服务的切片**：另跑 `pnpm test:e2e`（或 CI 上跑）。  
3. **T1.4 / T1.5 起**：`apps/api` 中对应集成测试必须在 PR 中可见增长。  
4. **Phase 3 起**：看板 API 须具备 **可重复** 的集成测试，前端图表须有 E2E 覆盖。  
5. **Phase 5**：压力、安全、真机与 **T5.2** 按任务书执行。

### 5.5 环境与数据隔离

- **CI / E2E**：独立 `DATABASE_URL` 或一次性容器 Schema；Playwright 报告目录不入库（见根 `.gitignore`）。  
- **真机**：PRD **iOS Safari / Android Chrome**；CI 以 **Chromium** 为主；发版前矩阵写入测试报告。

### 5.6 安全回归用例（与 T5.1 对齐，摘要）

- **Admin/CMS**：非 Admin 越权、批量导出等。
- **看板 API**：公开端点无需认证即可访问；个人对比端点需 JWT 认证。

---

## 6. 给 Cursor 的特别指令 (AI Coding Guidelines)
类型优先: 所有 API 请求/响应、数据库模型必须先定义 TypeScript Interface。
组件化: 将 AVG 游戏的剧情节点、选项、精灵反应抽象为配置驱动的组件。
性能优化: 大量精灵图片使用 <Image> 组件优化，看板数据量大时考虑分页或缓存。
错误边界: 测试过程中若报错，必须保留当前进度，不允许数据丢失。
注释与可读性: 每个手写源码文件须有**文件头注释**（简要说明本文件职责）；**重要函数、复杂逻辑与非显而易见分支**须有注释说明意图，保证可读性；**关键算法**（如 MBTI 计分、维度映射）必须添加详细注释，解释心理学依据（与 **`PPA_Development_Task.md` §4.1** 一致）。
测试: 遵循 **§5**（全环节单元覆盖 + Playwright E2E + 门禁）；**每个任务模块合并前**须带齐对应 **Jest / Vitest / Playwright** 用例，并通过 **`pnpm test:gate`**；涉及 UI/跨服务时另跑 **`pnpm test:e2e`**。

## 7. 部署注意事项
HTTPS: 生产环境必须配置 SSL 证书 (Let's Encrypt)。
静态资源: 图片/音频建议上传至对象存储 (AWS S3 / 阿里云 OSS) 并配置 CDN。
环境变量: 敏感信息严禁硬编码，使用 Docker Secrets 或云平台变量管理。