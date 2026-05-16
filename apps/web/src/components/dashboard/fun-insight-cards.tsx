/**
 * 趣味数据卡片组：展示最常见/最稀有类型、最受欢迎精灵、维度平衡度。
 */
'use client';

import type { FunInsights } from '@/lib/dashboard-api';

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
  const total = props.leftCount + props.rightCount;
  const leftPct = total > 0 ? (props.leftCount / total) * 100 : 50;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{props.left}</span>
        <span>{props.right}</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        <div className="rounded-full bg-primary transition-all" style={{ width: `${leftPct}%` }} />
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
          value={mostCommonType.type}
          detail={`${mostCommonType.count} 人（${mostCommonType.percentage}%）`}
        />
        <InsightCard
          label="最少人的类型"
          value={rarestType.type}
          detail={`${rarestType.count} 人（${rarestType.percentage}%）`}
        />
        <InsightCard
          label="最受欢迎精灵"
          value={mostPopularSprite.sprite}
          detail={`${mostPopularSprite.count} 人选择了它`}
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
