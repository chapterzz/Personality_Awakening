/**
 * 趣味数据卡片组：最常见/最稀有类型、最受欢迎精灵、维度平衡度（T3.4）。
 * 导出纯函数供 Vitest；维度条 D-A（chart-1 / chart-2 双色）。
 */
'use client';

import type { FunInsights } from '@/lib/dashboard-api';

/**
 * 维度条左侧占比 0–100；左右总数为 0 时返回 50（各半展示）。
 */
export function computeDimensionBarPercent(left: number, right: number): number {
  const total = left + right;
  if (total <= 0) return 50;
  return Math.round((left / total) * 100);
}

/**
 * 类型卡副文案：count>0 时含人数与百分比，否则固定空态文案。
 */
export function formatInsightDetail(count: number, percentage: number): string {
  if (count <= 0) return '暂无测评数据';
  return `${count} 人（${percentage}%）`;
}

/** 精灵卡副文案 */
function formatSpriteDetail(count: number): string {
  if (count <= 0) return '暂无测评数据';
  return `${count} 人选择了它`;
}

/** count 为 0 时主值显示占位符 */
function formatInsightValue(label: string, count: number): string {
  if (count <= 0) return '—';
  return label;
}

function InsightCard(props: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border-[3px] border-[var(--border)] bg-card p-4 shadow-clay-sm">
      <p className="text-xs font-medium text-muted-foreground">{props.label}</p>
      <p className="mt-1 font-display text-xl font-black text-foreground">{props.value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{props.detail}</p>
    </div>
  );
}

function DimensionBar(props: {
  left: string;
  right: string;
  leftCount: number;
  rightCount: number;
}) {
  const leftPct = computeDimensionBarPercent(props.leftCount, props.rightCount);
  const rightPct = 100 - leftPct;
  const ariaLabel = `${props.left} ${props.leftCount} 人，${props.right} ${props.rightCount} 人`;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{props.left}</span>
        <span>{props.right}</span>
      </div>
      <div
        className="flex h-3 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={ariaLabel}
      >
        <div
          className="transition-all"
          style={{ width: `${leftPct}%`, background: 'var(--chart-1)' }}
        />
        <div
          className="transition-all"
          style={{ width: `${rightPct}%`, background: 'var(--chart-2)' }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{props.leftCount} 人</span>
        <span>{props.rightCount} 人</span>
      </div>
    </div>
  );
}

export function FunInsightCards(props: { insights: FunInsights }) {
  const { mostCommonType, rarestType, mostPopularSprite, dimensionBalance } = props.insights;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-display font-bold text-foreground">趣味数据</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InsightCard
          label="最多人的类型"
          value={formatInsightValue(mostCommonType.type, mostCommonType.count)}
          detail={formatInsightDetail(mostCommonType.count, mostCommonType.percentage)}
        />
        <InsightCard
          label="最少人的类型"
          value={formatInsightValue(rarestType.type, rarestType.count)}
          detail={formatInsightDetail(rarestType.count, rarestType.percentage)}
        />
        <InsightCard
          label="最受欢迎精灵"
          value={formatInsightValue(mostPopularSprite.sprite, mostPopularSprite.count)}
          detail={formatSpriteDetail(mostPopularSprite.count)}
        />
        <div className="rounded-2xl border-[3px] border-[var(--border)] bg-card p-4 shadow-clay-sm">
          <p className="text-xs font-medium text-muted-foreground">维度平衡</p>
          <div className="mt-2 space-y-2">
            <DimensionBar
              left="E"
              right="I"
              leftCount={dimensionBalance.E}
              rightCount={dimensionBalance.I}
            />
            <DimensionBar
              left="S"
              right="N"
              leftCount={dimensionBalance.S}
              rightCount={dimensionBalance.N}
            />
            <DimensionBar
              left="T"
              right="F"
              leftCount={dimensionBalance.T}
              rightCount={dimensionBalance.F}
            />
            <DimensionBar
              left="J"
              right="P"
              leftCount={dimensionBalance.J}
              rightCount={dimensionBalance.P}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
