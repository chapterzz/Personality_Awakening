# CMS 题库/AVG 一键导入导出 — 设计规格

**日期**: 2026-05-23  
**范围**: Admin 后台为标准题库（T4.6）与 AVG 剧情脚本（T4.7）提供 JSON/CSV 单文件导入导出；列表页单条与「导出全部」均输出单文件，**不使用 zip**。

**依赖**: T4.6 `AdminQuestionnaireModule`、T4.7 `AdminAvgCmsModule`、`questionnaire-validation.ts`、`avg-script-validation.ts`、现有 ADMIN JWT + `RolesGuard`  
**非目标**: 精灵文案（`SpritePromptConfig`）导入导出、zip 打包、可视化编辑器、审计日志（T5.1 再加固）

---

## 1. 背景与目标

运营需要在 CMS 中快速备份、迁移、批量编辑题库与 AVG 脚本。MVP 提供：

- **标准题库**：JSON + CSV 单文件导入/导出（单条或全部）
- **AVG 脚本**：JSON 单文件导入/导出（单条或全部）
- **冲突处理**：ID 已存在时 UI 三选一（覆盖 / 新建 / 取消），批量导入整批统一策略
- **发布**：导入默认草稿；UI 可勾选「导入后立即发布」

### 需求确认记录（brainstorming 2026-05-23）

| 项         | 决策                                         |
| ---------- | -------------------------------------------- |
| AVG 范围   | 仅 `AvgScript` / `nodesJson`，不含精灵文案   |
| ID 冲突    | UI：覆盖 / 新建 / 取消                       |
| 格式       | 标准 JSON+CSV；AVG 仅 JSON                   |
| 发布后状态 | 默认草稿；可选「导入后立即发布」             |
| 入口       | 列表页：单条导出 + 导出全部 + 导入           |
| CSV 结构   | 每行一题，`options_json` 列嵌入选项数组      |
| 批量载体   | **单文件**（JSON 或 CSV），**不用 zip**      |
| 批量冲突   | 整批统一策略；选「取消」且存在冲突则整批中止 |

---

## 2. 方案

采用 **方案 A：扩展现有 Admin 模块**，在 `AdminQuestionnaireModule` 与 `AdminAvgCmsModule` 增加 import/export 端点；抽取共用工具（CSV 解析、snake_case 序列化、dry-run 冲突检测），校验复用现有 validation 模块。

| 方案                          | 结论                               |
| ----------------------------- | ---------------------------------- |
| A. 扩展 Admin 模块 + 共用工具 | **采用**                           |
| B. 前端拼装导出、后端仅导入   | 不采用（导出全部需 N 请求）        |
| C. 独立 ImportExport 策略模块 | 不采用（MVP 过度设计）             |
| zip 批量                      | **明确不做**（用户确认改为单文件） |

---

## 3. API 设计

所有端点需 `JwtAuthGuard` + `RolesGuard` + `@Roles(ADMIN)`。响应体除文件下载外仍遵循 `{ success, data, message }`。

### 3.1 标准题库

| 方法 | 路径                                                | 说明                                             |
| ---- | --------------------------------------------------- | ------------------------------------------------ |
| GET  | `/admin/questionnaires/:id/export?format=json\|csv` | 下载单条；`Content-Disposition: attachment`      |
| GET  | `/admin/questionnaires/export-all?format=json\|csv` | 下载全部问卷单文件                               |
| POST | `/admin/questionnaires/import`                      | `multipart/form-data`：`file` + 表单字段（见下） |

**POST import 表单/query 字段**

| 字段            | 类型                                    | 必填                   | 说明                                                |
| --------------- | --------------------------------------- | ---------------------- | --------------------------------------------------- |
| `format`        | `json` \| `csv`                         | 是                     | 与上传文件一致                                      |
| `dry_run`       | boolean                                 | 否                     | `true` 时仅解析+校验+冲突检测，不写库               |
| `on_conflict`   | `overwrite` \| `create_new` \| `cancel` | dry_run 后正式导入必填 | 批量整批统一                                        |
| `publish_after` | boolean                                 | 否                     | 默认 `false`；`true` 时导入后执行发布校验并发布     |
| `new_id_prefix` | string                                  | 否                     | `create_new` 时可选；默认 `{原id}-import-{6位后缀}` |

**dry_run 成功响应 `data` 示例**

```json
{
  "valid": true,
  "conflicts": [{ "id": "adaptive-demo-v1", "existing_title": "演示问卷" }],
  "preview": {
    "count": 1,
    "items": [{ "id": "adaptive-demo-v1", "title": "...", "question_count": 12 }]
  },
  "validation_errors": []
}
```

- 存在冲突且 `on_conflict=cancel`（或未传）：正式导入返回 `409`，`message=import_conflict`
- 校验失败：`400`，`data.validation_errors[]` 含 `{ code, path?, row? }`

### 3.2 AVG 脚本

| 方法 | 路径                            | 说明                             |
| ---- | ------------------------------- | -------------------------------- |
| GET  | `/admin/avg-scripts/:id/export` | JSON 单文件（无 format 参数）    |
| GET  | `/admin/avg-scripts/export-all` | JSON 单文件含 `scripts` 数组     |
| POST | `/admin/avg-scripts/import`     | 同 import 语义，仅 `format=json` |

---

## 4. 文件格式（schema_version = 1）

字段命名：**JSON 用 snake_case**（与 PRD / progress_data 一致）；CSV 列名 snake_case。

### 4.1 标准题库 — 单条 JSON

```json
{
  "schema_version": 1,
  "id": "adaptive-demo-v1",
  "title": "演示问卷",
  "questions": [
    {
      "id": "q_screen_ei",
      "prompt": "题干",
      "sort_order": 0,
      "dimension": "EI",
      "group_tag": "screening",
      "group_sort_order": 0,
      "options": [
        {
          "id": "o1",
          "label": "选项 A",
          "value_key": "a",
          "dimension": "EI",
          "side": "E",
          "weight": 2
        }
      ]
    }
  ]
}
```

- **不导出** `isPublished` / `publishedAt`（导入由 UI 控制发布）
- 每题至少 2 个选项（与发布校验一致）

### 4.2 标准题库 — 导出全部 JSON

```json
{
  "schema_version": 1,
  "exported_at": "2026-05-23T10:00:00.000Z",
  "questionnaires": [
    /* 单条 JSON 对象数组，不含 schema_version 嵌套 */
  ]
}
```

### 4.3 标准题库 — CSV（单条或全部）

UTF-8，首行表头，RFC4180 转义。每行一题：

| 列名                  | 说明                                      |
| --------------------- | ----------------------------------------- |
| `questionnaire_id`    | 问卷 ID                                   |
| `questionnaire_title` | 同一问卷内各行相同                        |
| `question_id`         | 题目 ID                                   |
| `prompt`              | 题干                                      |
| `sort_order`          | 整数                                      |
| `dimension`           | 可空                                      |
| `group_tag`           | 可空                                      |
| `group_sort_order`    | 可空                                      |
| `options_json`        | JSON 数组字符串，元素字段同 4.1 `options` |

导入时按 `questionnaire_id` 分组重建问卷；同一文件内 `questionnaire_title` 不一致以首行准或报错（实现取 **首行 title，冲突报错 `inconsistent_questionnaire_title`**）。

### 4.4 AVG — 单条 JSON

```json
{
  "schema_version": 1,
  "id": "demo-avg-v1",
  "title": "演示剧情",
  "start_node_id": "intro",
  "backgrounds": {},
  "nodes": {}
}
```

- `nodes` / `backgrounds` / `start_node_id` 须通过 `validateAvgNodesJson`
- 存储时 `nodesJson` = `{ start_node_id, backgrounds, nodes }`（与 T4.7 一致）

### 4.5 AVG — 导出全部 JSON

```json
{
  "schema_version": 1,
  "exported_at": "2026-05-23T10:00:00.000Z",
  "scripts": [
    /* 单条脚本对象数组 */
  ]
}
```

### 4.6 导入文件形态识别

| 类型      | 接受形态                                             |
| --------- | ---------------------------------------------------- |
| 标准 JSON | 单对象（§4.1）或 `{ questionnaires: [...] }`（§4.2） |
| 标准 CSV  | 任意行数，按 `questionnaire_id` 聚合                 |
| AVG JSON  | 单对象（§4.4）或 `{ scripts: [...] }`（§4.5）        |

`schema_version` 非 1 → `400 unsupported_schema_version`。

---

## 5. 导入语义

### 5.1 事务与覆盖

- **单条/批量每条**：Prisma `$transaction` 内完成
- **overwrite**：更新 `title`；`deleteMany` 该问卷下题目（cascade 选项）；按文件插入题目+选项
- **create_new**：新 `id`（用户可改前缀）；若题目/选项 ID 全局已存在 → `400 duplicate_question_id` / `duplicate_option_id`
- **cancel**（dry_run 后正式导入）：任一 `id` 冲突 → `409`，不写库

### 5.2 发布

- `publish_after=false`：`isPublished=false`，不写 `publishedAt`
- `publish_after=true`：写入后调用现有 `validateQuestionnaireForPublish` / AVG 等价校验，再 `publish*`

### 5.3 AVG 特有风险

覆盖已发布脚本且修改 `node id` 可能导致进行中会话 `script_mismatch`；导入成功响应/UI toast 保留 T4.7 既有警告文案。

---

## 6. 后端模块划分

```
apps/api/src/
  admin-questionnaire/
    questionnaire-import-export.ts      # 解析、序列化、applyImport
    admin-questionnaire.controller.ts   # 新增 export/import 路由
    admin-questionnaire.service.ts      # 委托或内联 import/export
  admin-avg-cms/
    avg-import-export.ts
    admin-avg-cms.controller.ts
  common/
    cms-export/
      csv-utils.ts                      # 解析/生成 CSV + options_json
      import-conflict.ts                # dry_run 冲突检测
```

- 单元测：`questionnaire-import-export.spec.ts`、`avg-import-export.spec.ts`、`csv-utils.spec.ts`
- 集成测：扩展 `admin-questionnaire.e2e-spec.ts`、`admin-avg-cms.e2e-spec.ts`（或新建 `admin-import-export.e2e-spec.ts`）

---

## 7. Admin UI

### 7.1 `/admin/questionnaires`

顶栏工具区：

- **导入**：`<input type=file accept=".json,.csv">` → 调用 `dry_run` → 冲突弹窗（覆盖/新建/取消 + 新建 ID 输入 + 「导入后立即发布」）→ 正式 import → 刷新列表
- **导出全部 ▾**：JSON | CSV
- 表格行：**导出 ▾** JSON | CSV

文件名建议：`questionnaire-{id}.json`、`questionnaires-all-{date}.json`、`questionnaires-all-{date}.csv`

### 7.2 `/admin/avg-scripts`

- **导入** / **导出全部** / 行内 **导出**（仅 JSON）
- 文件名：`avg-script-{id}.json`、`avg-scripts-all-{date}.json`

### 7.3 前端 API 客户端

扩展 `apps/web/src/lib/admin-api.ts`（或 `admin-import-export-api.ts`）：

- `downloadAdminExport(url)` → blob + 触发浏览器下载
- `importAdminQuestionnaires(file, options)` / `importAdminAvgScripts(file, options)`
- `dryRunImport(...)` 封装

---

## 8. 错误码（machine-readable `message` / `validation_errors[].code`）

| code                                            | 场景                                   |
| ----------------------------------------------- | -------------------------------------- |
| `unsupported_schema_version`                    | schema_version ≠ 1                     |
| `invalid_json` / `invalid_csv`                  | 解析失败                               |
| `csv_row_error`                                 | 某行缺列或 options_json 非法           |
| `inconsistent_questionnaire_title`              | 同 questionnaire_id 多 title           |
| `import_conflict`                               | cancel 策略下存在 ID 冲突              |
| `duplicate_question_id` / `duplicate_option_id` | create_new 时子 ID 冲突                |
| `validation_failed`                             | 业务校验失败（含现有 validation code） |

---

## 9. 测试策略

| 层级 | 内容                                                                                            |
| ---- | ----------------------------------------------------------------------------------------------- |
| 单元 | CSV 往返、JSON 单条/批量解析、overwrite/create_new/cancel、options_json 边界                    |
| 集成 | STUDENT 403；dry_run 冲突；overwrite 后 GET 详情一致；export-all 单文件再 import；publish_after |
| 门禁 | `pnpm test:gate`                                                                                |

E2E Playwright：本任务 **不强制**（P2）；API 集成测覆盖主路径。

---

## 10. 验收勾选

- [ ] 标准题库列表可导出单条 JSON/CSV、导出全部 JSON/CSV（单文件，无 zip）
- [ ] AVG 列表可导出单条/全部 JSON（单文件）
- [ ] 导入 JSON/CSV 支持单条与批量；冲突 UI 三选一；cancel 整批中止
- [ ] 导入默认草稿；勾选后立即发布且通过发布校验
- [ ] 校验失败返回可读错误（CSV 含行号）
- [ ] 非 ADMIN 403；`pnpm test:gate` 通过

---

## 11. 风险

| 风险                           | 缓解                                          |
| ------------------------------ | --------------------------------------------- |
| 大批量 CSV 内存                | MVP 问卷量级小（<100 题）；全量读入内存可接受 |
| 覆盖破坏进行中测评             | UI 警告 + T5.1 审计                           |
| CSV 手工编辑 options_json 易错 | 文档样例 + 校验错误行号                       |

---

## 12. 非目标

- zip / 多文件打包
- 精灵文案导入导出
- 导入时逐条不同冲突策略
- 导出 `isPublished` 状态
