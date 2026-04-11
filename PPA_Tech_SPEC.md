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
| **实时通信** | **Socket.io** | 低延迟实时推送；**产品 SLA** 以端到端（学生提交 → 教师可见）&lt; 1s 为准，**WebSocket 单次推送/投递延迟**可作为可选内部观测指标，与 SLA 区分 |
| **图表库** | **Recharts** 或 **ECharts** | 强大的数据可视化，支持动态更新 |
| **部署** | **Docker + Nginx** | 容器化，便于 CI/CD 和扩容 |
| **CI/CD** | **GitHub Actions** | 自动化测试与部署 |

### 1.1 实时通信：Socket.io 与 Nest 的关系（选型对齐）
- 技术栈表中的 **Socket.io** 指**传输协议与客户端库**（如 `socket.io-client`）。
- 后端在 NestJS 中使用 **`@nestjs/websockets`** 声明 Gateway，并配合 **`@nestjs/platform-socket.io`** 作为适配器，使 Gateway **底层实际跑在 Socket.io 上**（与上表一致，而非与 Socket.io 割裂的纯 `ws` 实现）。
- 实现时：`npm`/`pnpm` 依赖需同时包含 `socket.io`（及 Nest 侧 platform-socket.io），详见官方 Nest WebSockets + Socket.io 文档。

## 2. 项目目录结构 (Monorepo 建议)
planet-personality/
├── apps/
│ ├── web/ # Next.js 前端
│ │ ├── src/
│ │ │ ├── app/ # 路由 (/(student), /(teacher), /api)
│ │ │ ├── components/ # UI 组件 (ui/, features/, game/)
│ │ │ ├── hooks/ # 自定义 Hooks (useSocket, useTestProgress)
│ │ │ ├── lib/ # 工具 (socket-client, canvas-generator)
│ │ │ └── stores/ # Zustand stores
│ │ └── public/ # 静态资源 (sprites, audio)
│   └── api/ # NestJS 后端
│       └── src/
│           ├── auth/ # 认证模块 (Guest -> User)
│           ├── test/ # 测试逻辑 (Scoring, AVG engine)
│           ├── class/ # 班级管理 (WebSocket Gateway)
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

### 3.1 实时看板 (WebSocket / Socket.io)
- **教师身份与鉴权（与 PRD §1.1 / §2 一致）**：
  - **`TestClass.teacher_id`** → **`User.id`**；仅 **`role` 为 `TEACHER` 或 `ADMIN`** 的用户可作为班级创建者写入 `teacher_id`。
  - Gateway **连接 / join `class_{classId}`**：校验 JWT 中 **`user_id` 等于该班 `teacher_id`**（MVP）；否则拒绝订阅。学生端仅允许 `emit` 与提交结果相关事件，**不得**订阅教师聚合频道（若与学生通道分离，需在实现中拆分 namespace 或事件权限）。
- **后端**（与 §1.1 一致）: 
  - 使用 `@nestjs/websockets` + `@nestjs/platform-socket.io` 创建 `ClassRoomGateway`（底层 Socket.io）。
  - 房间命名：`class_{classId}`。
  - 事件：`submit_result` (客户端 emit) -> 广播 `update_stats` (服务器 emit)。
- **计时口径（与验收一致）**：本项目“实时延时 < 1s”的 SLA 以端到端为准（学生提交 -> 教师可见），即教师看板渲染完成在 1 秒内发生。
- **前端 (Teacher)**:
  - `useEffect` 中连接 Socket，join 房间。
  - 监听 `update_stats`，更新 Zustand store，触发 Recharts 重绘。
- **前端 (Student)**:
  - 提交试卷后，emit `submit_result` 事件。

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
安装依赖: pnpm install
配置环境变量: 复制 .env.example 到 .env，填写 DB URL, JWT Secret。
启动数据库: docker-compose up -d db
数据库迁移: 在**仓库根目录**执行 `pnpm prisma migrate dev`（Schema：`prisma/schema.prisma`）
启动服务:
Backend: pnpm dev:api (Port 3001)
Frontend: pnpm dev:web (Port 3000)
访问: http://localhost:3000

## 5. 给 Cursor 的特别指令 (AI Coding Guidelines)
类型优先: 所有 API 请求/响应、数据库模型必须先定义 TypeScript Interface。
组件化: 将 AVG 游戏的剧情节点、选项、精灵反应抽象为配置驱动的组件。
性能优化: 大量精灵图片使用 <Image> 组件优化，列表虚拟化（如果班级人数超多）。
错误边界: 测试过程中若报错，必须保留当前进度，不允许数据丢失。
注释: 关键算法（如 MBTI 计分、维度映射）必须添加详细注释，解释心理学依据。
测试: 为核心流程（注册、提交测试、WebSocket 推送）编写 Jest/E2E 测试用例。

## 6. 部署注意事项
HTTPS: 生产环境必须配置 SSL 证书 (Let's Encrypt)。
静态资源: 图片/音频建议上传至对象存储 (AWS S3 / 阿里云 OSS) 并配置 CDN。
环境变量: 敏感信息严禁硬编码，使用 Docker Secrets 或云平台变量管理。