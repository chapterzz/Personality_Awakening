# CMS 题库/AVG 一键导入导出 Implementation Plan

> **审核入口（HTML）**：请用浏览器打开  
> [`2026-05-23-cms-import-export.html`](./2026-05-23-cms-import-export.html)  
> 内含验收勾选、导入流程线框、文件格式样例、任务拆分。

> **For agentic workers:** 用户批准 HTML 计划后，使用 superpowers:subagent-driven-development 或 superpowers:executing-plans 按 Task 实施。实施前须 TDD。**禁止**在用户批准前修改 `apps/` 业务源码。

**Goal:** 为标准题库与 AVG 脚本 Admin CMS 提供 JSON/CSV **单文件**一键导入导出（无 zip），含 dry_run 冲突检测、覆盖/新建/取消策略与可选导入后发布。

**Architecture:** 在现有 `AdminQuestionnaireModule` / `AdminAvgCmsModule` 增加 export/import 路由；共用 `cms-export/csv-utils.ts` 与 `import-conflict.ts`；解析/序列化独立纯函数 + TDD；校验复用 `questionnaire-validation.ts` / `avg-script-validation.ts`；前端列表页工具栏 + 冲突确认 Dialog。

**Tech Stack:** NestJS 10、Prisma、`@nestjs/platform-express` FileInterceptor、Next.js 14、Shadcn Dialog/Button、Jest、supertest。

**Spec:** [2026-05-23-cms-import-export-design.md](../specs/2026-05-23-cms-import-export-design.md)

---

## File Map

| 操作   | 路径                                                                   |
| ------ | ---------------------------------------------------------------------- |
| Create | `apps/api/src/common/cms-export/csv-utils.ts`                          |
| Create | `apps/api/src/common/cms-export/csv-utils.spec.ts`                     |
| Create | `apps/api/src/common/cms-export/import-conflict.ts`                    |
| Create | `apps/api/src/common/cms-export/import-conflict.spec.ts`               |
| Create | `apps/api/src/admin-questionnaire/questionnaire-import-export.ts`      |
| Create | `apps/api/src/admin-questionnaire/questionnaire-import-export.spec.ts` |
| Create | `apps/api/src/admin-questionnaire/dto/import-questionnaire.dto.ts`     |
| Modify | `apps/api/src/admin-questionnaire/admin-questionnaire.controller.ts`   |
| Modify | `apps/api/src/admin-questionnaire/admin-questionnaire.service.ts`      |
| Create | `apps/api/src/admin-avg-cms/avg-import-export.ts`                      |
| Create | `apps/api/src/admin-avg-cms/avg-import-export.spec.ts`                 |
| Create | `apps/api/src/admin-avg-cms/dto/import-avg-script.dto.ts`              |
| Modify | `apps/api/src/admin-avg-cms/admin-avg-cms.controller.ts`               |
| Modify | `apps/api/src/admin-avg-cms/admin-avg-cms.service.ts`                  |
| Create | `apps/api/test/admin-import-export.e2e-spec.ts`                        |
| Create | `apps/web/src/lib/admin-import-export-api.ts`                          |
| Create | `apps/web/src/components/admin/cms-import-dialog.tsx`                  |
| Modify | `apps/web/src/app/admin/questionnaires/page.tsx`                       |
| Modify | `apps/web/src/app/admin/avg-scripts/page.tsx`                          |

---

### Task 1: CSV 工具与冲突检测（TDD）

**Files:**

- Create: `apps/api/src/common/cms-export/csv-utils.ts`
- Create: `apps/api/src/common/cms-export/csv-utils.spec.ts`
- Create: `apps/api/src/common/cms-export/import-conflict.ts`
- Create: `apps/api/src/common/cms-export/import-conflict.spec.ts`

- [ ] **Step 1: 写 csv-utils 失败测试**

```typescript
// csv-utils.spec.ts
import { parseQuestionnaireCsv, serializeQuestionnaireCsv, CSV_HEADERS } from './csv-utils';

const SAMPLE_ROWS = [
  {
    questionnaire_id: 'q1',
    questionnaire_title: 'T',
    question_id: 'qq1',
    prompt: 'P',
    sort_order: '0',
    dimension: 'EI',
    group_tag: 'screening',
    group_sort_order: '0',
    options_json:
      '[{"id":"o1","label":"A","value_key":"a","dimension":"EI","side":"E","weight":2},{"id":"o2","label":"B","value_key":"b","dimension":"EI","side":"I","weight":2}]',
  },
];

describe('csv-utils', () => {
  it('round-trips questionnaire rows', () => {
    const csv = serializeQuestionnaireCsv(SAMPLE_ROWS);
    expect(csv.split('\n')[0]).toBe(CSV_HEADERS.join(','));
    const parsed = parseQuestionnaireCsv(csv);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].questionnaire_id).toBe('q1');
    expect(JSON.parse(parsed[0].options_json)).toHaveLength(2);
  });

  it('throws csv_row_error on bad options_json', () => {
    const bad = serializeQuestionnaireCsv([{ ...SAMPLE_ROWS[0], options_json: 'not-json' }]);
    expect(() => parseQuestionnaireCsv(bad)).toThrow(/csv_row_error/);
  });
});
```

- [ ] **Step 2: 运行测试确认 FAIL**

Run: `pnpm --filter api test -- csv-utils.spec.ts`  
Expected: FAIL — module not found

- [ ] **Step 3: 实现 csv-utils.ts**

```typescript
/** CSV 列名（与 spec §4.3 一致） */
export const CSV_HEADERS = [
  'questionnaire_id',
  'questionnaire_title',
  'question_id',
  'prompt',
  'sort_order',
  'dimension',
  'group_tag',
  'group_sort_order',
  'options_json',
] as const;

export type QuestionnaireCsvRow = Record<(typeof CSV_HEADERS)[number], string>;

/** RFC4180 最小实现：逗号分隔、双引号转义 */
export function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function serializeQuestionnaireCsv(rows: QuestionnaireCsvRow[]): string {
  const lines = [CSV_HEADERS.join(',')];
  for (const row of rows) {
    lines.push(CSV_HEADERS.map((h) => escapeCsvField(row[h] ?? '')).join(','));
  }
  return lines.join('\n');
}

export function parseQuestionnaireCsv(text: string): QuestionnaireCsvRow[] {
  // 解析首行表头 + 数据行；实现 parseCsvRecords() 辅助
  // 每行校验 CSV_HEADERS 齐全；options_json 须 JSON.parse 成功否则 throw Error('csv_row_error:row=N')
}
```

- [ ] **Step 4: import-conflict 测试与实现**

```typescript
// import-conflict.ts
export type OnConflict = 'overwrite' | 'create_new' | 'cancel';

export function resolveImportIds(
  incomingIds: string[],
  existingIds: Set<string>,
  onConflict: OnConflict,
  newIdSuffix: string,
): { targetIds: string[]; conflicts: Array<{ id: string }> } {
  const conflicts = incomingIds.filter((id) => existingIds.has(id)).map((id) => ({ id }));
  if (onConflict === 'cancel' && conflicts.length > 0) {
    return { targetIds: [], conflicts };
  }
  const targetIds = incomingIds.map((id) =>
    existingIds.has(id) ? (onConflict === 'create_new' ? `${id}-import-${newIdSuffix}` : id) : id,
  );
  return { targetIds, conflicts };
}
```

- [ ] **Step 5: 运行测试 PASS**

Run: `pnpm --filter api test -- csv-utils.spec.ts import-conflict.spec.ts`

---

### Task 2: 标准题库 import/export 纯函数（TDD）

**Files:**

- Create: `apps/api/src/admin-questionnaire/questionnaire-import-export.ts`
- Create: `apps/api/src/admin-questionnaire/questionnaire-import-export.spec.ts`

- [ ] **Step 1: 写失败测试 — JSON 单条解析 + CSV 聚合**

```typescript
import {
  parseQuestionnaireImportJson,
  parseQuestionnaireImportCsv,
  serializeQuestionnaireExportJson,
  type QuestionnaireImportItem,
} from './questionnaire-import-export';

const ITEM: QuestionnaireImportItem = {
  id: 'q1',
  title: 'Demo',
  questions: [
    {
      id: 'qq1',
      prompt: 'P',
      sort_order: 0,
      dimension: 'EI',
      group_tag: 'screening',
      group_sort_order: 0,
      options: [
        { id: 'o1', label: 'A', value_key: 'a', dimension: 'EI', side: 'E', weight: 2 },
        { id: 'o2', label: 'B', value_key: 'b', dimension: 'EI', side: 'I', weight: 2 },
      ],
    },
  ],
};

it('parses single-object JSON', () => {
  const payload = { schema_version: 1, ...ITEM };
  expect(parseQuestionnaireImportJson(JSON.stringify(payload))).toEqual([ITEM]);
});

it('parses bulk JSON with questionnaires array', () => {
  const payload = { schema_version: 1, questionnaires: [ITEM] };
  expect(parseQuestionnaireImportJson(JSON.stringify(payload))).toEqual([ITEM]);
});

it('rejects unsupported_schema_version', () => {
  expect(() => parseQuestionnaireImportJson('{"schema_version":2}')).toThrow(
    /unsupported_schema_version/,
  );
});
```

- [ ] **Step 2: 实现 parse/serialize 函数**

关键导出类型：

```typescript
export type QuestionnaireImportItem = {
  id: string;
  title: string;
  questions: Array<{
    id: string;
    prompt: string;
    sort_order: number;
    dimension: string | null;
    group_tag: string | null;
    group_sort_order: number | null;
    options: Array<{
      id: string;
      label: string;
      value_key: string;
      dimension: string | null;
      side: string | null;
      weight: number | null;
    }>;
  }>;
};
```

- `parseQuestionnaireImportCsv`: 用 Task1 `parseQuestionnaireCsv` → 按 `questionnaire_id` group → 校验 `inconsistent_questionnaire_title`
- `serializeQuestionnaireExportJson(single|all)`: snake_case，不含 `isPublished`
- `validateQuestionnaireImportItems(items)`: 调用 `validateQuestionGroupFields` / `validateOptionScoring` 每题每选项

- [ ] **Step 3: 运行 `questionnaire-import-export.spec.ts` PASS**

---

### Task 3: AdminQuestionnaire export/import API

**Files:**

- Create: `apps/api/src/admin-questionnaire/dto/import-questionnaire.dto.ts`
- Modify: `apps/api/src/admin-questionnaire/admin-questionnaire.service.ts`
- Modify: `apps/api/src/admin-questionnaire/admin-questionnaire.controller.ts`

- [ ] **Step 1: DTO**

```typescript
// import-questionnaire.dto.ts
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

export class ImportQuestionnaireQueryDto {
  @IsIn(['json', 'csv'])
  format!: 'json' | 'csv';

  @IsOptional()
  @IsBoolean()
  dry_run?: boolean;

  @IsOptional()
  @IsEnum(['overwrite', 'create_new', 'cancel'])
  on_conflict?: 'overwrite' | 'create_new' | 'cancel';

  @IsOptional()
  @IsBoolean()
  publish_after?: boolean;

  @IsOptional()
  @IsString()
  new_id_suffix?: string;
}
```

- [ ] **Step 2: Service 方法**

```typescript
async exportQuestionnaire(id: string, format: 'json' | 'csv'): Promise<{ body: string; filename: string; contentType: string }>;
async exportAllQuestionnaires(format: 'json' | 'csv'): Promise<...>;
async importQuestionnaires(
  fileBuffer: Buffer,
  opts: ImportQuestionnaireQueryDto,
): Promise<ImportResultDto>;
```

`importQuestionnaires` 逻辑：

1. 按 format 解析 → `validateQuestionnaireImportItems`
2. 查 DB existing ids → `resolveImportIds`
3. `dry_run` → 返回 `{ valid, conflicts, preview, validation_errors }`
4. `on_conflict=cancel` 且有 conflicts → `ConflictException('import_conflict')`
5. `$transaction` 逐条 overwrite/create_new 写入
6. `publish_after` → 调现有 `publishQuestionnaire`

- [ ] **Step 3: Controller 路由**

```typescript
@Get('questionnaires/:id/export')
async exportOne(@Param('id') id: string, @Query('format') format: 'json' | 'csv', @Res() res: Response) {
  const { body, filename, contentType } = await this.service.exportQuestionnaire(id, format);
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(body);
}

@Get('questionnaires/export-all')
async exportAll(@Query('format') format: 'json' | 'csv', @Res() res: Response) { ... }

@Post('questionnaires/import')
@UseInterceptors(FileInterceptor('file'))
async import(
  @UploadedFile() file: Express.Multer.File,
  @Query() query: ImportQuestionnaireQueryDto,
) { ... }
```

注意：`export-all` 路由须注册在 `questionnaires/:id` **之前**，避免 `export-all` 被当作 id。

- [ ] **Step 4: 手动 smoke**

Run API dev + curl export（可选）；主要依赖 Task 8 集成测。

---

### Task 4: AVG import/export 纯函数 + API（TDD）

**Files:**

- Create: `apps/api/src/admin-avg-cms/avg-import-export.ts`
- Create: `apps/api/src/admin-avg-cms/avg-import-export.spec.ts`
- Create: `apps/api/src/admin-avg-cms/dto/import-avg-script.dto.ts`
- Modify: `apps/api/src/admin-avg-cms/admin-avg-cms.service.ts`
- Modify: `apps/api/src/admin-avg-cms/admin-avg-cms.controller.ts`

- [ ] **Step 1: avg-import-export.spec.ts**

测试：

- 单对象 / `scripts[]` 批量 JSON 解析
- `validateAvgNodesJson` 失败 → validation_errors
- serialize 单条 / export-all 含 `exported_at`

- [ ] **Step 2: 实现 avg-import-export.ts**

```typescript
export type AvgImportItem = {
  id: string;
  title: string;
  start_node_id: string;
  backgrounds: Record<string, string>;
  nodes: Record<string, unknown>;
};
```

存储时 `nodesJson = { start_node_id, backgrounds, nodes }`。

- [ ] **Step 3: Service + Controller**

镜像 Task 3：

- `GET /admin/avg-scripts/:id/export`
- `GET /admin/avg-scripts/export-all`（注册顺序在 `:id` 前）
- `POST /admin/avg-scripts/import` multipart

- [ ] **Step 4: 单元测 PASS**

Run: `pnpm --filter api test -- avg-import-export.spec.ts`

---

### Task 5: 集成测试 admin-import-export.e2e-spec.ts

**Files:**

- Create: `apps/api/test/admin-import-export.e2e-spec.ts`

- [ ] **Step 1: 写 e2e 测试**

覆盖：

1. STUDENT `POST /admin/questionnaires/import` → 403
2. export JSON 单条 → 再 dry_run import → conflicts 含 id
3. `on_conflict=overwrite` 导入 → GET detail 题干一致
4. `on_conflict=cancel` + 冲突 → 409
5. `on_conflict=create_new` → 新 id 存在
6. export-all JSON → import 批量 2 条
7. CSV export-all round-trip
8. AVG export → import overwrite
9. `publish_after=true` 导入后公开 GET 可见

- [ ] **Step 2: 运行集成测**

Run: `pnpm test:integration -- admin-import-export.e2e-spec.ts`  
Expected: PASS

---

### Task 6: 前端 API 客户端 + 导入 Dialog

**Files:**

- Create: `apps/web/src/lib/admin-import-export-api.ts`
- Create: `apps/web/src/components/admin/cms-import-dialog.tsx`

- [ ] **Step 1: admin-import-export-api.ts**

```typescript
export async function downloadAdminBlob(path: string, filename: string): Promise<void> {
  const res = await fetch(`${apiBase()}${path}`, { headers: { Authorization: `Bearer ${getAdminToken()}` } });
  if (!res.ok) throw new Error(`export_${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type ImportDryRunResult = {
  valid: boolean;
  conflicts: Array<{ id: string; existing_title?: string }>;
  preview: { count: number; items: Array<{ id: string; title: string; question_count?: number }> };
  validation_errors: Array<{ code: string; row?: number; path?: string }>;
};

export async function dryRunQuestionnaireImport(file: File, format: 'json' | 'csv'): Promise<ImportDryRunResult> { ... }
export async function commitQuestionnaireImport(file: File, opts: ImportCommitOptions): Promise<void> { ... }
// AVG 同理
```

- [ ] **Step 2: cms-import-dialog.tsx**

Props: `kind: 'questionnaire' | 'avg'`, `onSuccess: () => void`

UI 流程：

1. 隐藏 `<input type="file">` + 触发按钮
2. 选文件后自动 `dryRun`
3. Dialog 展示 preview + conflicts
4. 单选：覆盖 / 新建 / 取消（有冲突时默认不选）
5. `create_new` 时可选 `new_id_suffix` 输入（默认留空用服务端后缀）
6. Checkbox「导入后立即发布」
7. 确认 → commit import → toast 成功（AVG 覆盖警告文案）

---

### Task 7: 列表页 UI 接入

**Files:**

- Modify: `apps/web/src/app/admin/questionnaires/page.tsx`
- Modify: `apps/web/src/app/admin/avg-scripts/page.tsx`

- [ ] **Step 1: questionnaires/page.tsx 顶栏**

```tsx
<div className="flex flex-wrap gap-2">
  <CmsImportDialog kind="questionnaire" onSuccess={reload} />
  <ExportDropdown
    label="导出全部"
    formats={['json', 'csv']}
    onExport={(f) =>
      downloadAdminBlob(
        `/admin/questionnaires/export-all?format=${f}`,
        `questionnaires-all-${date}.${f}`,
      )
    }
  />
</div>
```

表格行操作列增加「导出 ▾」JSON | CSV。

- [ ] **Step 2: avg-scripts/page.tsx**

仅 JSON：导入 Dialog + 导出全部 + 行内导出。

- [ ] **Step 3: 本地手动验证**

`pnpm dev:web` + `pnpm dev:api`，Admin 登录后测试导入导出。

---

### Task 8: 门禁验证

- [ ] **Step 1: 运行全量门禁**

Run: `pnpm test:gate`  
Expected: PASS

- [ ] **Step 2: 更新工作日志（若当日会话结束）**

`work-logs/2026-05-23-工作日志.md`

---

## Spec Coverage Self-Review

| Spec 要求                 | Task                             |
| ------------------------- | -------------------------------- |
| 标准 JSON+CSV 单文件      | Task 1–3, 7                      |
| AVG 仅 JSON               | Task 4, 7                        |
| 无 zip                    | 全任务（export 直接 attachment） |
| dry_run + 冲突三选一      | Task 3–5, 6                      |
| 批量整批统一策略          | import-conflict + e2e            |
| 默认草稿 + publish_after  | Task 3–4 Service                 |
| 列表页入口                | Task 7                           |
| CSV options_json 每行一题 | Task 1–2                         |
| 校验错误行号              | csv-utils + validation_errors    |
| ADMIN 403                 | Task 8 e2e                       |
| test:gate                 | Task 8                           |

---

## 批准门禁

用户回复「**批准导入导出计划**」后，进入阶段 C 实施 → 阶段 D 代码检视 → 阶段 E `pnpm test:gate` 验证。
