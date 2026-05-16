# 全局洞察看板设计文档

**日期**: 2026-05-16
**范围**: 原 T3.1 任务调整 — 去掉教师角色和班级概念，改为面向所有用户的汇总数据看板

---

## 1. 背景与目标

原 T3.1 要求实现班级管理系统（教师创建班级、学生加入、权限校验、WebSocket 实时看板）。需求调整后，改为实现一个**公开的全局洞察看板**，展示所有注册用户测评结果的汇总统计，无需登录即可访问。

### 核心目标

- 展示所有用户的 MBTI 类型分布（16 型人格人数柱状图）
- 展示类型×精灵矩阵热力图
- 展示趣味数据卡片（最常见/最稀有类型、最受欢迎精灵、维度平衡度）
- 登录用户可看到自己的类型与全局对比

---

## 2. 后端设计

### 2.1 新增模块

`apps/api/src/dashboard/` — DashboardModule

```
dashboard/
├── dashboard.module.ts
├── dashboard.controller.ts
└── dashboard.service.ts
```

### 2.2 API 端点

#### `GET /dashboard/stats`（公开，无需认证）

聚合查询 `TestResult` 表，返回预计算的统计数据。

**响应结构：**

```json
{
  "success": true,
  "data": {
    "totalUsers": 128,
    "typeDistribution": [
      { "type": "INFP", "count": 18 },
      { "type": "ENFP", "count": 15 }
    ],
    "spriteHeatmap": [
      { "type": "INFP", "sprite": "月影探索精灵", "count": 16 },
      { "type": "ENFP", "sprite": "曦光领航精灵", "count": 12 }
    ],
    "funInsights": {
      "mostCommonType": { "type": "INFP", "count": 18, "percentage": 14.1 },
      "rarestType": { "type": "ESTJ", "count": 2, "percentage": 1.6 },
      "mostPopularSprite": { "sprite": "月影探索精灵", "count": 72 },
      "dimensionBalance": {
        "E": 45,
        "I": 55,
        "S": 40,
        "N": 60,
        "T": 48,
        "F": 52,
        "J": 42,
        "P": 58
      }
    }
  }
}
```

#### `GET /dashboard/my-comparison`（需 JWT 认证）

返回当前用户的人格类型与全局数据的对比。

**响应结构：**

```json
{
  "success": true,
  "data": {
    "myType": "INFP",
    "typePercentage": 14.1,
    "typeRank": 1
  }
}
```

### 2.3 聚合逻辑

DashboardService 使用 Prisma 的 `groupBy` + 聚合查询：

```typescript
// 类型分布
const typeGroups = await prisma.testResult.groupBy({
  by: ['mbtiType'],
  _count: { id: true },
  orderBy: { _count: { id: 'desc' } },
});

// 精灵映射：MBTI 首字母 E → 曦光领航精灵，I → 月影探索精灵
// 在服务端用与前端 sprite-profile-card.tsx 相同的逻辑
```

### 2.4 精灵映射规则

与 `apps/web/src/components/report/sprite-profile-card.tsx` 一致：

- MBTI 首字母 `E` → 曦光领航精灵
- MBTI 首字母 `I` → 月影探索精灵

---

## 3. 前端设计

### 3.1 页面路由

`apps/web/src/app/dashboard/page.tsx` — 公开页面

### 3.2 页面布局

```
┌─────────────────────────────────────────────┐
│          性格星球 · 全局洞察                    │
│          已有 XXX 位探索者完成测评              │
├───────────────────────┬─────────────────────┤
│  16型人格人数分布       │  类型×精灵热力图       │
│  (Recharts BarChart)  │  (CSS Grid + 颜色)   │
├───────────────────────┴─────────────────────┤
│  趣味数据卡片                                  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│  │最多类型 │ │最少类型 │ │热门精灵 │ │维度平衡 │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ │
├─────────────────────────────────────────────┤
│  [仅登录用户] 你的类型：INFP（14.1% 的人也是）  │
└─────────────────────────────────────────────┘
```

### 3.3 组件拆分

| 组件                    | 路径                                               | 职责                          |
| ----------------------- | -------------------------------------------------- | ----------------------------- |
| `DashboardHero`         | `components/dashboard/dashboard-hero.tsx`          | 顶部 Hero 区域，标题 + 总人数 |
| `TypeDistributionChart` | `components/dashboard/type-distribution-chart.tsx` | 16型人格条形图                |
| `SpriteHeatmap`         | `components/dashboard/sprite-heatmap.tsx`          | 类型×精灵矩阵热力图           |
| `FunInsightCards`       | `components/dashboard/fun-insight-cards.tsx`       | 趣味数据卡片组                |
| `PersonalComparison`    | `components/dashboard/personal-comparison.tsx`     | 个人对比区（登录用户）        |

### 3.4 数据获取

- 客户端 `useEffect` + `fetch` 调用 `/dashboard/stats`
- 复用 `apps/web/src/lib/api-base.ts` 的 `getBrowserApiBaseUrl()`
- 个人对比：检查 `apps/web/src/lib/auth-token.ts` 是否有 token，有则调用 `/dashboard/my-comparison`

### 3.5 入口

在首页 (`/`) 添加"查看全局洞察"按钮，链接到 `/dashboard`。

---

## 4. 技术约束

- 使用现有 Recharts 库（已在 `package.json` 中）渲染图表
- 热力图可用 CSS Grid + 动态颜色实现（Recharts 原生热力图支持有限）
- 后端聚合查询需考虑数据量增长，添加适当索引（`mbti_type` 字段已有 `@@index`）
- 公开 API 需考虑频率限制（可后续迭代）

---

## 5. 不在范围内

- WebSocket 实时更新（已移除）
- 教师角色 / 班级管理（已移除）
- 数据导出功能
- 时间维度趋势图
