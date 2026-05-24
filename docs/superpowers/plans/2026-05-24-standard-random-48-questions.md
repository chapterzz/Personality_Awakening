# 标准模式随机 48 题抽题 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 替换 T2.7 自适应逻辑，从已发布大题库分层随机抽取 48 题（每维度 12 题），支持重新开始时「重新洗牌」或「沿用上次题序」。

**Architecture:** 改造 `POST /questionnaire/:id/sequence` 为分层随机 + Fisher-Yates 洗牌；纯函数抽到 `random-sequence.util.ts` 便于单测；前端简化 hook 并增加重新开始选择 UI；Seed 新增 `standard-v1` 问卷（96 题）。

**Tech Stack:** NestJS 10、Prisma、Next.js 14、Jest、Vitest、Playwright

**Spec:** [2026-05-24-standard-random-48-questions-design.md](../specs/2026-05-24-standard-random-48-questions-design.md)

---

## 文件结构

| 文件                                                       | 职责                                              |
| ---------------------------------------------------------- | ------------------------------------------------- |
| `apps/api/src/questionnaire/random-sequence.util.ts`       | Fisher-Yates 洗牌、分层抽样、reuse 校验（纯函数） |
| `apps/api/src/questionnaire/random-sequence.util.spec.ts`  | 纯函数单测                                        |
| `apps/api/src/questionnaire/questionnaire.service.ts`      | 查库 + 调用 util + 抛 400                         |
| `apps/api/src/questionnaire/dto/generate-sequence.dto.ts`  | strategy / previous_ordered_question_ids          |
| `apps/api/src/questionnaire/questionnaire.controller.ts`   | 传 DTO 至 service                                 |
| `apps/api/src/questionnaire/questionnaire.service.spec.ts` | service 集成 mock 单测                            |
| `prisma/seed-standard-random.ts`                           | 生成 96 题并 upsert `standard-v1`                 |
| `prisma/seed.ts`                                           | main 末尾调用 seedStandardRandom                  |
| `apps/web/src/lib/questionnaire-api.ts`                    | 新 options 参数                                   |
| `apps/web/src/hooks/use-random-standard-test.ts`           | 新 hook（自 use-adaptive-standard-test 简化而来） |
| `apps/web/src/app/test/standard/standard-test-client.tsx`  | 切换 hook + 重新开始对话框                        |
| `e2e/helpers/random-standard-seed.ts`                      | 替代 adaptive-standard-seed                       |
| `apps/api/test/helpers/golden-path-helpers.ts`             | 更新 sequence 调用                                |

---

### Task 1: 纯函数工具 + 单测

**Files:**

- Create: `apps/api/src/questionnaire/random-sequence.util.ts`
- Create: `apps/api/src/questionnaire/random-sequence.util.spec.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/api/src/questionnaire/random-sequence.util.spec.ts
import {
  PRESENTED_COUNT,
  PER_DIMENSION_COUNT,
  DIMENSIONS,
  groupQuestionsByDimension,
  validateDimensionPools,
  pickStratifiedRandomIds,
  validateReuseIds,
  shuffleArray,
} from './random-sequence.util';

describe('random-sequence.util', () => {
  const mkPool = (dim: string, n: number) =>
    Array.from({ length: n }, (_, i) => ({ id: `${dim}-${i + 1}`, dimension: dim }));

  it('validateDimensionPools throws when pool < 12', () => {
    const grouped = {
      EI: mkPool('EI', 8),
      SN: mkPool('SN', 12),
      TF: mkPool('TF', 12),
      JP: mkPool('JP', 12),
    };
    expect(() => validateDimensionPools(grouped)).toThrow(/insufficient_questions/);
  });

  it('pickStratifiedRandomIds returns 48 unique ids, 12 per dimension', () => {
    const grouped = Object.fromEntries(DIMENSIONS.map((d) => [d, mkPool(d, 24)])) as Record<
      (typeof DIMENSIONS)[number],
      { id: string; dimension: string }[]
    >;
    const rng = () => 0; // 确定性：始终 swap index 0
    const ids = pickStratifiedRandomIds(grouped, rng);
    expect(ids).toHaveLength(PRESENTED_COUNT);
    expect(new Set(ids).size).toBe(PRESENTED_COUNT);
    for (const dim of DIMENSIONS) {
      const dimCount = ids.filter((id) => id.startsWith(`${dim}-`)).length;
      expect(dimCount).toBe(PER_DIMENSION_COUNT);
    }
  });

  it('validateReuseIds rejects wrong length', () => {
    const all = mkPool('EI', 1);
    expect(() => validateReuseIds(['a'], all, groupedFromPools())).toThrow();
  });

  it('shuffleArray permutes with injected rng', () => {
    const input = ['a', 'b', 'c', 'd'];
    const out = shuffleArray([...input], () => 0);
    expect(out).not.toEqual(input);
    expect(out.sort()).toEqual(input.sort());
  });
});

function groupedFromPools() {
  return Object.fromEntries(DIMENSIONS.map((d) => [d, mkPool(d, 12)])) as any;
}
function mkPool(dim: string, n: number) {
  return Array.from({ length: n }, (_, i) => ({ id: `${dim}-${i + 1}`, dimension: dim }));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter api test -- random-sequence.util.spec`
Expected: FAIL — module not found

- [ ] **Step 3: Implement util**

```typescript
// apps/api/src/questionnaire/random-sequence.util.ts
/** 随机题序纯函数：分层抽样、洗牌、reuse 校验。 */
import { BadRequestException } from '@nestjs/common';

export const PRESENTED_COUNT = 48;
export const PER_DIMENSION_COUNT = 12;
export const DIMENSIONS = ['EI', 'SN', 'TF', 'JP'] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export type QuestionRef = { id: string; dimension: string | null };

export type Rng = () => number; // [0, 1)

export function defaultRng(): number {
  const { randomInt } = require('crypto') as typeof import('crypto');
  return randomInt(0, 1_000_000) / 1_000_000;
}

export function groupQuestionsByDimension(
  questions: QuestionRef[],
): Record<Dimension, QuestionRef[]> {
  const grouped = Object.fromEntries(DIMENSIONS.map((d) => [d, [] as QuestionRef[]])) as Record<
    Dimension,
    QuestionRef[]
  >;
  for (const q of questions) {
    if (q.dimension && DIMENSIONS.includes(q.dimension as Dimension)) {
      grouped[q.dimension as Dimension].push(q);
    }
  }
  return grouped;
}

export function validateDimensionPools(grouped: Record<Dimension, QuestionRef[]>): void {
  for (const dim of DIMENSIONS) {
    const available = grouped[dim].length;
    if (available < PER_DIMENSION_COUNT) {
      throw new BadRequestException({
        success: false,
        message: 'insufficient_questions',
        data: { dimension: dim, required: PER_DIMENSION_COUNT, available },
      });
    }
  }
}

export function shuffleArray<T>(arr: T[], rng: Rng): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function pickStratifiedRandomIds(
  grouped: Record<Dimension, QuestionRef[]>,
  rng: Rng = defaultRng,
): string[] {
  const picked: string[] = [];
  for (const dim of DIMENSIONS) {
    const pool = shuffleArray([...grouped[dim]], rng);
    picked.push(...pool.slice(0, PER_DIMENSION_COUNT).map((q) => q.id));
  }
  return shuffleArray(picked, rng);
}

export function validateReuseIds(
  previousIds: string[],
  allQuestions: QuestionRef[],
  grouped: Record<Dimension, QuestionRef[]>,
): string[] {
  if (previousIds.length !== PRESENTED_COUNT) {
    throw new BadRequestException({
      success: false,
      message: 'invalid_reuse_sequence',
      data: { reason: 'wrong_length', expected: PRESENTED_COUNT, actual: previousIds.length },
    });
  }
  const idSet = new Set(allQuestions.map((q) => q.id));
  for (const id of previousIds) {
    if (!idSet.has(id)) {
      throw new BadRequestException({
        success: false,
        message: 'invalid_reuse_sequence',
        data: { reason: 'unknown_question_id', question_id: id },
      });
    }
  }
  const dimCounts = Object.fromEntries(DIMENSIONS.map((d) => [d, 0])) as Record<Dimension, number>;
  const dimById = new Map(allQuestions.map((q) => [q.id, q.dimension]));
  for (const id of previousIds) {
    const dim = dimById.get(id);
    if (dim && DIMENSIONS.includes(dim as Dimension)) {
      dimCounts[dim as Dimension]++;
    }
  }
  for (const dim of DIMENSIONS) {
    if (dimCounts[dim] !== PER_DIMENSION_COUNT) {
      throw new BadRequestException({
        success: false,
        message: 'invalid_reuse_sequence',
        data: { reason: 'dimension_imbalance', dimension: dim, count: dimCounts[dim] },
      });
    }
  }
  return previousIds;
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm --filter api test -- random-sequence.util.spec`
Expected: PASS

- [ ] **Step 5: Commit**（用户要求时）

---

### Task 2: QuestionnaireService 重写 + 单测

**Files:**

- Modify: `apps/api/src/questionnaire/dto/generate-sequence.dto.ts`
- Modify: `apps/api/src/questionnaire/questionnaire.service.ts`
- Modify: `apps/api/src/questionnaire/questionnaire.controller.ts`
- Modify: `apps/api/src/questionnaire/questionnaire.service.spec.ts`（整文件替换）

- [ ] **Step 1: Update DTO**

```typescript
// generate-sequence.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';

export class GenerateSequenceDto {
  @ApiPropertyOptional({ enum: ['shuffle', 'reuse'], default: 'shuffle' })
  @IsOptional()
  @IsIn(['shuffle', 'reuse'])
  strategy?: 'shuffle' | 'reuse';

  @ApiPropertyOptional({ description: 'reuse 时传入上次 ordered_question_ids' })
  @ValidateIf((o) => o.strategy === 'reuse')
  @IsArray()
  @IsString({ each: true })
  previous_ordered_question_ids?: string[];
}
```

- [ ] **Step 2: Rewrite service method signature**

```typescript
async generateOrderedQuestionIds(
  questionnaireId: string,
  options?: { strategy?: 'shuffle' | 'reuse'; previousOrderedQuestionIds?: string[] },
): Promise<string[]>
```

删除 `extractSignals`、`findWeakDimensions` 及自适应常量；调用 util。

- [ ] **Step 3: Replace questionnaire.service.spec.ts**

Mock 48 题题库（每维度 24 题），测试：

- shuffle → 48 题、无重复
- reuse 合法 → 相同顺序
- reuse 非法 → 400
- 题池不足 → 400 insufficient_questions

Run: `pnpm --filter api test -- questionnaire.service.spec`
Expected: PASS

- [ ] **Step 4: Update controller**

```typescript
const orderedQuestionIds = await this.service.generateOrderedQuestionIds(id, {
  strategy: body.strategy ?? 'shuffle',
  previousOrderedQuestionIds: body.previous_ordered_question_ids,
});
```

---

### Task 3: Seed 96 题题库

**Files:**

- Create: `prisma/seed-standard-random.ts`
- Modify: `prisma/seed.ts`

- [ ] **Step 1: 程序化生成 96 题**

```typescript
// prisma/seed-standard-random.ts
export const STANDARD_RANDOM_QUESTIONNAIRE_ID = 'standard-v1';
const DIMENSIONS = ['EI', 'SN', 'TF', 'JP'] as const;
const PER_DIM = 24;

export function buildStandardRandomQuestions() {
  const questions = [];
  let sortOrder = 1;
  for (const dim of DIMENSIONS) {
    for (let i = 1; i <= PER_DIM; i++) {
      const id = `sr-${dim.toLowerCase()}-${String(i).padStart(2, '0')}`;
      questions.push({
        id,
        prompt: `[${dim}] 演示题目 ${i}`,
        sortOrder: sortOrder++,
        dimension: dim,
        groupTag: null,
        groupSortOrder: null,
        options: [
          {
            id: `${id}_A`,
            label: '选项 A',
            valueKey: `${id}_A`,
            dimension: dim,
            side: dim[0],
            weight: 2,
          },
          {
            id: `${id}_B`,
            label: '选项 B',
            valueKey: `${id}_B`,
            dimension: dim,
            side: dim[1],
            weight: 2,
          },
        ],
      });
    }
  }
  return questions;
}
```

- [ ] **Step 2: main 中 upsert standard-v1**

Run: `pnpm db:seed`
Expected: `Seeded questionnaire "standard-v1" with 96 questions.`

- [ ] **Step 3: 手动 smoke**

Run: `curl -X POST http://localhost:3001/questionnaire/standard-v1/sequence -H "Content-Type: application/json" -d "{}"`
Expected: `ordered_question_ids` 长度 48

---

### Task 4: 前端 API 客户端 + 单测

**Files:**

- Modify: `apps/web/src/lib/questionnaire-api.ts`
- Modify: `apps/web/src/lib/questionnaire-api.spec.ts`

- [ ] **Step 1: 更新 fetchQuestionSequence 签名**

```typescript
export type SequenceStrategy = 'shuffle' | 'reuse';

export async function fetchQuestionSequence(
  id: string,
  options?: { strategy?: SequenceStrategy; previousOrderedQuestionIds?: string[] },
): Promise<ApiSequenceData> {
  const body: Record<string, unknown> = {};
  if (options?.strategy) body.strategy = options.strategy;
  if (options?.previousOrderedQuestionIds) {
    body.previous_ordered_question_ids = options.previousOrderedQuestionIds;
  }
  // ... fetch POST with JSON.stringify(body)
}
```

- [ ] **Step 2: 更新 spec（6 个用例改为 shuffle/reuse）**

Run: `pnpm --filter web run test:unit -- questionnaire-api`
Expected: PASS

---

### Task 5: Hook 重构

**Files:**

- Create: `apps/web/src/hooks/use-random-standard-test.ts`（自 adaptive 复制后删减）
- Delete or keep: `apps/web/src/hooks/use-adaptive-standard-test.ts`（删除并更新 import）

- [ ] **Step 1: 创建 use-random-standard-test.ts**

删除：`SCREENING_COUNT`、`screeningExtending`、筛选轮 useEffect、`extendingInProgressRef`

修改初始加载：

```typescript
const seqData = await fetchQuestionSequence(questionnaireId, { strategy: 'shuffle' });
```

修改 restart：

```typescript
const restart = useCallback(async (strategy: 'shuffle' | 'reuse') => {
  // ...
  const seqData = await fetchQuestionSequence(questionnaireId, {
    strategy,
    previousOrderedQuestionIds:
      strategy === 'reuse' ? (current.standard.ordered_question_ids ?? []) : undefined,
  });
  const initial = createInitialStandardProgress(seqData.ordered_question_ids, questionnaireId);
  // persist...
}, [...]);
```

- [ ] **Step 2: 更新 standard-test-client.tsx**

```typescript
const QUESTIONNAIRE_ID = 'standard-v1';
import { useRandomStandardTest } from '@/hooks/use-random-standard-test';
```

删除 `screeningExtending` UI 引用。

---

### Task 6: 重新开始对话框 UI

**Files:**

- Modify: `apps/web/src/app/test/standard/standard-test-client.tsx`

- [ ] **Step 1: 增加 state + 轻量 modal**

```tsx
const [restartOpen, setRestartOpen] = useState(false);

// 完成页按钮 onClick={() => setRestartOpen(true)}

{
  restartOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border-[3px] border-[var(--border)] bg-card p-6 shadow-clay">
        <p className="font-display text-lg font-bold">重新开始</p>
        <p className="mt-2 text-sm text-muted-foreground">请选择如何开始新一轮测试：</p>
        <div className="mt-6 flex flex-col gap-3">
          <Button
            onClick={() => {
              setRestartOpen(false);
              void t.restart('shuffle');
            }}
          >
            换一批新题目
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setRestartOpen(false);
              void t.restart('reuse');
            }}
          >
            相同题目再做一次
          </Button>
          <Button variant="ghost" onClick={() => setRestartOpen(false)}>
            取消
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 题池不足错误文案**

loadError 含 `insufficient` 时展示「题库配置不足，请联系管理员」。

---

### Task 7: E2E / 集成测试更新

**Files:**

- Create: `e2e/helpers/random-standard-seed.ts`
- Modify: `e2e/standard-restart-after-complete.spec.ts`
- Modify: `apps/api/test/helpers/golden-path-helpers.ts`
- Modify: `apps/web/src/test/standard-test-client.hooks-order.spec.tsx`

- [ ] **Step 1: random-standard-seed.ts**

```typescript
export const STANDARD_QUESTIONNAIRE_ID = 'standard-v1';
export const EXPECTED_PRESENTED_COUNT = 48;

export async function fetchRandomOrderedIds(request, options?) {
  const res = await request.post(
    `${API_BASE}/questionnaire/${STANDARD_QUESTIONNAIRE_ID}/sequence`,
    {
      data: options ?? { strategy: 'shuffle' },
    },
  );
  // expect 48 ids
}
```

- [ ] **Step 2: 更新 standard-restart-after-complete.spec.ts**

- 期望 total = 48
- 新增用例：reuse 后题序相同（通过 API 对比两次 progress 中 ordered_question_ids）

- [ ] **Step 3: 更新 golden-path-helpers.ts**

`fetchAdaptiveOrderedIds` → `fetchStandardOrderedIds`，去掉 `answers` 参数。

---

### Task 8: 全量验证

- [ ] **Step 1: API 单测**

Run: `pnpm --filter api test -- questionnaire`
Expected: ALL PASS

- [ ] **Step 2: Web 单测**

Run: `pnpm --filter web run test:unit`
Expected: PASS

- [ ] **Step 3: 集成测**

Run: `pnpm test:integration`
Expected: PASS

- [ ] **Step 4: 静态门禁**

Run: `pnpm test:gate`
Expected: PASS

---

## Spec 覆盖自检

| AC                  | Task                                |
| ------------------- | ----------------------------------- |
| AC-1 48 题每维度 12 | Task 1, 2                           |
| AC-2 全局洗牌       | Task 1                              |
| AC-3 题池不足 400   | Task 1, 2                           |
| AC-4 续答不重新抽   | Task 5（有 progress 不调 sequence） |
| AC-5 restart 两策略 | Task 5, 6, 7                        |
| AC-6 移除 screening | Task 5                              |
| AC-7 Seed + gate    | Task 3, 8                           |
