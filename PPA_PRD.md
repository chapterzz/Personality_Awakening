# 产品需求文档 (PRD) - 性格星球：觉醒计划 (v4.0)

## 1. 功能模块详解

### 1.1 用户认证与档案 (Auth & Profile)

#### 进行中测试进度的统一存储（游客与注册用户）
- **唯一落点**：凡**未完成**的测试（标准模式 / AVG），答题进度只写入 **`TemporarySession.progress_data`**（JSON），**不**写入 `TestResult`。
- **`TestResult`**：仅在用户**正式提交**（完成本次测评）后创建一行，保存维度分值、人格类型、`completed_at` 等终态数据。
- **`TemporarySession` 与身份的关系**：
  - **游客**：`user_id` 为空，用 `session_id`（与客户端 `temp_session_id` 对应）定位进度。
  - **注册用户**：`user_id` 指向 `User.id`，同一用户同一时刻**至多一条**进行中的会话；**多端**共享该条记录，并发写入规则见 **§2.5**；`progress_data` 字段结构见 **§2.4**。

#### 游客模式 (Guest)
- 进入即分配 `temp_session_id` (存 Cookie/LocalStorage)。
- 答题进度实时写入 `TemporarySession`（`user_id` 为空）。
- 若关闭浏览器，7 天内可通过原设备/链接恢复进度。

#### 注册用户：先注册再测 / 进度展示 / 保存 / 续答
- **支持先注册再启动测试**：用户登录后进入测评，服务端为该用户创建或复用一条 **`TemporarySession`**（`user_id` 已绑定），进度仍只写在 `progress_data`。
- **测试进度展示**：答题页展示当前模式、题号/章节、整体进度条（标准模式按题序；AVG 按章节与节点）；数据来自当前会话的 `progress_data` 或服务端派生字段。
- **进度保存**：
  - 标准模式：与现有规则一致，至少每 5 题自动保存至 `TemporarySession`；关键操作（切题、选选项）可更细粒度保存（实现自定，须满足断网与刷新不丢题）。
  - AVG 模式：每个剧情节点/选项确认后写入 `TemporarySession`，支持中途退出与续答。
- **退出后下次登陆续答**：用户使用账号密码登录后，**按 `user_id` 拉取**未过期且未提交的 `TemporarySession`，恢复 `progress_data`，从上次离开处继续；**不依赖**仅游客使用的设备 Cookie（仍可同时写 `temp_session_id` 作辅助）。

#### 转化注册 (Conversion)（游客 → 正式用户）
- **触发点**：提交试卷前、加入班级前、查看完整报告前。
- **流程**：输入 `昵称` (唯一性校验 + 随机后缀防重) + `密码`。
- **动作（与「进行中进度」一致）**：
  - 创建 `User` 记录；
  - 将当前 **`TemporarySession`** 绑定 `user_id`（原 `session_id` / `progress_data` 保留），**不**在此时生成 `TestResult`（未完成时）；
  - 若游客在本次会话内**已完成答题并提交**，则在同一事务内创建 `TestResult` 并视策略删除或归档该次 `TemporarySession`。

- **个人中心**:
  - 展示：历史测试记录、拥有的精灵徽章、已加入的班级列表。
  - 操作：修改昵称、重置密码、下载数据报告 (PDF/JSON)、注销账号 (软删除标记 -> 定时任务物理删除)。

#### 用户角色与身份（学生 / 教师 / 管理员）
- **统一用户表**：学生、教师、管理员均为 **`User`** 的一条记录（同一套昵称 + 密码注册体系），通过 **`User.role`** 区分职能（枚举建议：`STUDENT` | `TEACHER` | `ADMIN`）。**游客**无 `User` 行，仅有 `TemporarySession`。
- **教师 (Guide)**：`role = TEACHER` 的注册用户；**创建班级**、**查看/订阅该班实时看板**等能力仅授予「该班级的任课教师」身份（见下条与 §1.3）。
- **管理员 (Admin)**：`role = ADMIN`；用于 CMS、运维类能力（与开发任务书 T4.5 等对齐）。**MVP 赋权方式**：默认自助注册为 `STUDENT`；`TEACHER` / `ADMIN` 由 **Seed、管理员后台提升或运营预置账号** 完成（不在此文档展开运营流程细节）。
- **班级与教师的绑定**：**`TestClass.teacher_id`** 为 **外键 → `User.id`**，且目标用户须为 **`TEACHER`（或产品允许时 `ADMIN`）**；创建班级时写入当前登录用户的 `id`。学生通过 `UserClassRelation` 加入班级，**不得**将任意学生 `user_id` 写入 `teacher_id`。

### 1.2 测试引擎 (Assessment Engine)
- **模式选择页**:
  - 卡片式选择：标准模式 (⏱️约 10 分钟) vs AVG 冒险模式 (🎮约 8 分钟)。
- **标准模式**:
  - 进度条显示，每 5 题自动保存。
  - 支持中途退出；**游客**凭 `temp_session_id` 恢复，**注册用户**凭登录态按 `user_id` 拉取 `TemporarySession` 续答（见 §1.1）。
- **AVG 冒险模式**:
  - **剧情结构**: 4 个章节 (E/I, S/N, T/F, J/P)，每章包含 3-5 个情境题。
  - **交互**: 对话气泡 + 背景动效 + 选项按钮。
  - **智能反馈**: 
    - 犹豫检测：若单题停留 > 30s，引导精灵弹出提示。
    - 逻辑互斥检测：若前后选项严重矛盾，精灵弹出“纠结”互动。
  - **资源加载**: 背景图、Lottie 动画按需懒加载。
  - **进度与续答**：进行中数据写入 `TemporarySession`；注册用户退出后再次登录，从 `progress_data` 恢复章节与节点（与标准模式续答规则一致）。
- **评分算法**:
  - 后端实时计算四个维度得分，映射为 16 型人格之一。
  - 记录各维度具体分值（用于绘制雷达图）。

### 1.3 班级与实时看板 (Class & Live Dashboard)
- **创建班级**:
  - **前置条件**：调用者须为已登录用户，且 **`User.role` 为 `TEACHER`（或产品允许的 `ADMIN`）**。
  - 输入班级名称 -> 生成 `invite_code` (6 位字母数字混合) 和 `join_link`；**`TestClass.teacher_id` = 当前用户 `User.id`**。
  - 设置：最大人数限制、是否允许自由加入。
- **加入班级**:
  - 学生输入代码或点击链接 -> 确认加入 -> 绑定 `user_class_relation`。
- **教师实时看板 (核心)**:
  - **鉴权**：仅 **`TestClass.teacher_id` 与当前 JWT 用户 `id` 一致**（或后续扩展的「班级协作者」表，MVP 可不做）的用户可订阅该班 WS 与拉取聚合统计；学生端不得订阅他班教师频道。
  - **连接方式**: WebSocket / Socket.io 订阅班级频道（与技术规格书一致）。
  - **可视化组件**:
    - **精灵热力图**: 16 个 SVG 精灵，大小/亮度随人数动态变化 (CSS Transition)。
    - **维度条形图**: E/I, S/N, T/F, J/P 百分比分布。
    - **实时计数器**: “已参与人数 / 总人数”。
  - **智能洞察**:
    - 自动生成的文本结论 (如："本班 E 人占比 70%，氛围活跃")。
    - 预警提示 (如："I 人比例极高，建议安排安静活动")。
  - **刷新机制**: 只要有新学生提交结果，前端图表无感平滑更新，无需整页刷新。

### 1.4 结果与分享 (Results & Sharing)
- **个人报告页**:
  - 展示：人格类型 (如 INFP)、精灵形象、四维雷达图、详细解析。
  - 科普区：折叠式“科学边界”说明（信度、效度、非二元论）。
- **海报生成**:
  - 前端 Canvas 绘制：包含精灵图、昵称、人格代码、二维码。
  - 下载为 PNG 图片。
- **语音彩蛋**:
  - 扫描二维码 -> H5 页面播放该人格的预录制音频或 TTS 语音。

### 1.5 科普图书馆 (Library)
- 内容管理系统 (CMS) 简易版：后台配置文章/视频。
- 前端展示：分类列表（基础理论、反标签、名人案例）。
- 互动小测试：嵌入简单的判断题，答对解锁徽章。

## 2. 数据模型设计 (ERD 简述)

### 2.1 实体说明
- **User**: `id (UUID)`, `nickname`, `password_hash`, **`role` (枚举: `STUDENT` \| `TEACHER` \| `ADMIN`)**, `created_at`, `is_deleted`  
  - **`role` 默认值**：新用户自助注册为 `STUDENT`；`TEACHER` / `ADMIN` 由 Seed、后台赋权或运营配置。
- **TestClass**: `id`, `name`, `invite_code`, **`teacher_id` (UUID, FK → `User.id`, NOT NULL)**，`settings (JSON)`  
  - **约束**：被引用用户的 `role` 须为 **`TEACHER` 或 `ADMIN`**（应用层 + 可选 DB 检查）；创建班级时写入。
- **UserClassRelation**: `user_id`, `class_id`, `joined_at`
- **TestResult**: `id`, `user_id`, `mode (STANDARD/AVG)`, `scores (JSON)`, `type (INFP)`, `completed_at`  
  - **仅表示已提交的正式结果**；不包含「做到一半」的进度。
- **TemporarySession**: 进行中测评的**唯一存储**（游客与注册用户共用）。
  - `session_id` (PK 或唯一)：与客户端 `temp_session_id` 对应。
  - `user_id` (UUID, **可空**)：游客为空；注册用户绑定后非空。
  - `progress_data` (JSON)：**结构见 §2.4**（全量使用 **snake_case** 键名）。
  - `progress_revision` (INT，默认 `0`)：**乐观锁版本号**；每次成功保存进度后服务端原子 `+1`；与 **§2.5** 多端策略配合。
  - `expires_at`：过期清理（如 7 天未更新）。
  - `updated_at`：上次保存时间（用于续答与展示「最近练习」）。
  - **约束建议**：`user_id` 非空时，对「进行中」会话做 **唯一约束**（同一 `user_id` 仅允许一条未提交会话；MVP 不做多套并行测评）。

### 2.2 状态流（摘要）
- **进行中**：只存在 `TemporarySession`（`user_id` 可有可无）。
- **提交完成**：写入 `TestResult`，并删除或失效对应 `TemporarySession`（实现二选一，须保证不重复统计）。

### 2.3 权限与鉴权（摘要）
- **JWT**（或会话）载荷至少包含 `user_id` 与 **`role`**；后端 Guard 按接口要求校验（如：创建班级须 `TEACHER`/`ADMIN`；看板 WS 须 `user_id == TestClass.teacher_id`）。
- **Admin API**（CMS）：须 **`role = ADMIN`**（与 T4.5 一致）。

### 2.4 `progress_data` JSON 契约（snake_case，当前 `schema_version = 1`）

顶层字段（**所有进行中测评均须具备**）：

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :---: | :--- |
| `schema_version` | number | 是 | 契约版本；**MVP 固定为 `1`**，后续升级可迁移。 |
| `mode` | string | 是 | `STANDARD` 或 `AVG`，须与当前答题流一致。 |
| `questionnaire_id` | string | 否 | 当前使用的标准题库/问卷**发布版本 id**（来自 CMS，便于升级与对账）。 |
| `standard` | object | 条件 | **`mode === STANDARD` 时必填**。 |
| `avg` | object | 条件 | **`mode === AVG` 时必填**。 |
| `meta` | object | 否 | 客户端元信息，不参与计分。 |

#### `standard` 对象

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :---: | :--- |
| `current_index` | number | 是 | 当前题在**已下发题序**中的下标，**从 0 开始**。 |
| `answers` | object | 是 | 键为 **`question_id`**（string），值为 **`option_id`** 或题库约定的答题值（string/number，与 CMS 定义一致）。 |
| `ordered_question_ids` | string[] | 否 | 当前会话**题序**（自适应 T2.7 时由服务端生成后下发，客户端原样回传以便续答）。 |
| `answered_count` | number | 否 | 已答题数量缓存，可由服务端重算；存在时需与 `answers` 一致。 |

#### `avg` 对象

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :---: | :--- |
| `script_id` | string | 是 | AVG 剧情配置 **id**（CMS 发布版本）。 |
| `node_id` | string | 是 | 当前停留的**剧情节点 id**。 |
| `chapter` | string | 否 | 业务章节标签，取值建议 `EI` \| `SN` \| `TF` \| `JP`（与 PRD 四章对应）。 |
| `answers` | object | 否 | 键为 **`node_id`**，值为该节点下的**选项 id**，供计分与互斥检测。 |
| `visited_node_ids` | string[] | 否 | 已访问节点顺序，用于互斥/回溯；可由服务端从 `answers` 推导，**二选一**即可。 |

#### `meta` 对象（可选）

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `started_at` | string (ISO 8601) | 客户端开始本卷测评的时间。 |
| `last_client` | string | 可选：简短客户端标识（如 `web-ios-safari`），仅供排障。 |

**说明**：`scores`、最终 `type` 等**仅**在提交后写入 **`TestResult`**，**不得**依赖 `progress_data` 中的临时聚合作为正式结果（若实现中有草稿分，须单独键名如 `draft_dimension_totals` 且仅调试用途，MVP 可不实现）。

### 2.5 多端会话与并发写入（MVP）

- **单源真相**：同一注册用户（`user_id` 非空）在「进行中」状态下**全局仅一条** `TemporarySession`（数据库唯一约束）；手机与 PC **共用**该条记录与同一 `progress_data`。
- **游客**：以 `session_id` 为维度；**不保证**跨浏览器匿名合并（MVP 可接受）；转化绑定 `user_id` 后纳入注册用户规则。
- **并发写入（乐观锁）**：
  - 表字段 **`progress_revision`**：初始 `0`；每次 **`PUT` 保存 `progress_data` 成功**后，服务端在**同一事务**内将 `progress_revision` **加 1** 并更新 `updated_at`。
  - 客户端在 **GET 进度** 时获得当前 `progress_revision`；下次 **PUT** 须在请求体（或约定请求头）携带 **`if_match_revision`**，**等于**服务端当前值才允许写入；否则返回 **HTTP 409 Conflict**，错误体携带**最新** `progress_data` 与 `progress_revision`，由前端提示「其他设备已更新进度」并**覆盖本地或让用户选择以服务端为准**（MVP 推荐**自动采用服务端快照**）。
  - **禁止**在无校验情况下用旧 payload 覆盖新进度（避免双端互相覆盖丢答案）。
- **同时打开答题页**：两端均应周期性或在 `focus` 时 **GET** 刷新；若本地有未保存编辑且收到更高 `revision`，应提示用户后再合并（MVP 可简化为直接拉取服务端为准）。

## 3. 交互与 UI 规范
- **设计风格**: "轻赛博 + 盲盒风"。深色模式默认，高饱和度霓虹色点缀。
- **动效**: 
  - 页面切换：Fade In/Slide Up。
  - 数据更新：数字滚动动画，图表生长动画。
  - 精灵：Idle 状态下的呼吸灯效果。
- **响应式**:
  - Mobile: 单列布局，底部导航栏 (测试/中心/班级/图书馆)。
  - Desktop: 侧边导航，宽屏仪表盘布局。
- **异常处理**:
  - 断网：顶部横幅提示“信号丢失”，禁用提交按钮，本地暂存操作。
  - 服务错误：友好的“星球维护中”插画页。

## 4. 验收标准 (Acceptance Criteria)
- [ ] 学生未注册可完成测试；**注册后**进行中进度**归属正式账号**（`TemporarySession` 绑定 `user_id`），可续答；**正式提交**后写入 `TestResult` 并与 PRD 状态流一致。
- [ ] **注册用户**可先登录再开始测评；答题进度正确展示、自动保存；退出后再次登录可从上次位置续答（标准模式与 AVG 均覆盖）。
- [ ] **多端**：同一账号仅一条进行中会话；双端同时保存时 **409 + `if_match_revision`** 行为符合 §2.5，不出现静默覆盖丢进度。
- [ ] 教师端开启页面后，新学生提交结果（提交成功写入结果后）时，图表在 1 秒内端到端自动更新（学生提交 -> 教师可见）。
- [ ] 移动端 AVG 模式流畅，无明显卡顿，资源加载正常。
- [ ] 注销账号后，数据库中无法查询到该用户的任何个人信息。
- [ ] 海报生成功能在 iOS 和 Android 上均能正常下载图片。