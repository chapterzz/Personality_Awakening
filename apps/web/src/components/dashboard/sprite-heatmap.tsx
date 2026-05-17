/**
 * 类型×精灵矩阵热力图：CSS Grid + color-mix 深浅；图例 L-A 渐变条；登录列高亮 H-D 外发光。
 */
'use client';

import { Fragment, useMemo } from 'react';
import type { SpriteHeatmapItem } from '@/lib/dashboard-api';
import { cn } from '@/lib/utils';

/** 16 型顺序（与后端 DashboardService 一致） */
export const HEATMAP_MBTI_TYPES = [
  'INTJ',
  'INTP',
  'ENTJ',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISFJ',
  'ESTJ',
  'ESFJ',
  'ISTP',
  'ISFP',
  'ESTP',
  'ESFP',
] as const;

export const HEATMAP_SPRITES = ['曦光领航精灵', '月影探索精灵'] as const;

const XI_GUANG = '曦光领航精灵';

/**
 * 读取矩阵单元格人数（稀疏 API 数据补 0）。
 */
export function getHeatmapCount(data: SpriteHeatmapItem[], type: string, sprite: string): number {
  return data.find((d) => d.type === type && d.sprite === sprite)?.count ?? 0;
}

/**
 * 热力图配色归一化分母，空数据时为 1 避免除零。
 */
export function computeHeatmapMaxCount(data: SpriteHeatmapItem[]): number {
  if (data.length === 0) return 1;
  return Math.max(1, ...data.map((d) => d.count));
}

/**
 * 精灵行基色：曦光 chart-1，月影 chart-2。
 */
export function resolveSpriteRowColor(sprite: string): string {
  return sprite === XI_GUANG ? 'var(--chart-1)' : 'var(--chart-2)';
}

/**
 * 单元格背景：color-mix 映射人数深浅（0 人约 8%，满格约 100%）。
 */
export function getHeatmapCellBackground(sprite: string, count: number, maxCount: number): string {
  const base = resolveSpriteRowColor(sprite);
  const percent = count === 0 ? 8 : Math.round(25 + (75 * count) / maxCount);
  return `color-mix(in srgb, ${base} ${percent}%, transparent)`;
}

/** 审核选定 H-D：登录用户类型列外发光（chart-3） */
export function getHighlightColumnCellClassName(
  columnType: string,
  highlightType?: string | null,
): string {
  if (!highlightType || columnType !== highlightType) return '';
  return 'shadow-[0_0_10px_2px_color-mix(in_srgb,var(--chart-3)_55%,transparent)]';
}

/**
 * 类型×精灵热力图：横轴 16 型，纵轴两只精灵，底部 L-A 渐变图例。
 */
export function SpriteHeatmap(props: { data: SpriteHeatmapItem[]; highlightType?: string | null }) {
  const maxCount = useMemo(() => computeHeatmapMaxCount(props.data), [props.data]);
  const highlightType = props.highlightType ?? null;

  return (
    <section className="rounded-3xl border-[3px] border-[var(--border)] bg-card p-6 shadow-clay">
      <h2 className="text-lg font-display font-bold text-foreground">类型 × 精灵热力图</h2>
      {highlightType ? (
        <p className="mt-1 text-sm text-muted-foreground">
          高亮为你的类型：
          <span className="font-bold" style={{ color: 'var(--chart-3)' }}>
            {highlightType}
          </span>
        </p>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <div
          role="grid"
          aria-label="MBTI 类型与精灵人数热力图"
          className="inline-grid min-w-[520px] gap-1"
          style={{
            gridTemplateColumns: `auto repeat(${HEATMAP_MBTI_TYPES.length}, minmax(32px, 1fr))`,
          }}
        >
          <div role="presentation" />
          {HEATMAP_MBTI_TYPES.map((t) => (
            <div
              key={t}
              role="columnheader"
              className={cn(
                'text-center text-[9px] font-medium leading-tight text-muted-foreground',
                highlightType === t && 'font-bold text-[var(--chart-3)]',
              )}
            >
              {t}
            </div>
          ))}

          {HEATMAP_SPRITES.map((sprite) => (
            <Fragment key={sprite}>
              <div className="sticky left-0 z-10 flex items-center whitespace-nowrap bg-card pr-2 text-xs text-muted-foreground">
                {sprite.replace('精灵', '')}
              </div>
              {HEATMAP_MBTI_TYPES.map((t) => {
                const count = getHeatmapCount(props.data, t, sprite);
                return (
                  <div
                    key={`${t}-${sprite}`}
                    role="gridcell"
                    className={cn(
                      'flex min-h-8 min-w-8 items-center justify-center rounded-md text-[10px] font-bold text-foreground',
                      getHighlightColumnCellClassName(t, highlightType),
                    )}
                    style={{ background: getHeatmapCellBackground(sprite, count, maxCount) }}
                    title={`${t} · ${sprite}：${count} 人`}
                  >
                    {count > 0 ? count : ''}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {/* L-A：少 — 渐变条 — 多（曦光基色示意密度） */}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span>少</span>
        <div
          className="h-2.5 max-w-[200px] flex-1 rounded-full"
          style={{
            background:
              'linear-gradient(90deg, color-mix(in srgb, var(--chart-1) 12%, transparent), var(--chart-1))',
          }}
          aria-hidden
        />
        <span>多</span>
      </div>
    </section>
  );
}
