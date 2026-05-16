/**
 * 类型×精灵矩阵热力图：CSS Grid 布局，颜色深浅表示人数。
 */
'use client';

import { Fragment } from 'react';
import type { SpriteHeatmapItem } from '@/lib/dashboard-api';

const ALL_TYPES = [
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
];

const SPRITES = ['曦光领航精灵', '月影探索精灵'];

export function SpriteHeatmap(props: { data: SpriteHeatmapItem[] }) {
  const maxCount = Math.max(...props.data.map((d) => d.count), 1);

  function getCount(type: string, sprite: string): number {
    return props.data.find((d) => d.type === type && d.sprite === sprite)?.count ?? 0;
  }

  function getOpacity(count: number): number {
    if (count === 0) return 0.05;
    return 0.2 + (count / maxCount) * 0.8;
  }

  return (
    <section className="rounded-3xl border-[3px] border-[var(--border)] bg-card p-6 shadow-clay">
      <h2 className="text-lg font-display font-bold text-foreground">类型 × 精灵热力图</h2>
      <div className="mt-4 overflow-x-auto">
        <div
          className="inline-grid gap-1"
          style={{ gridTemplateColumns: `auto repeat(${ALL_TYPES.length}, minmax(28px, 1fr))` }}
        >
          {/* 表头：MBTI 类型 */}
          <div />
          {ALL_TYPES.map((t) => (
            <div
              key={t}
              className="text-center text-[9px] font-medium text-muted-foreground leading-tight"
            >
              {t}
            </div>
          ))}
          {/* 数据行：每个精灵一行 */}
          {SPRITES.map((sprite) => (
            <Fragment key={sprite}>
              <div className="flex items-center pr-2 text-xs text-muted-foreground whitespace-nowrap">
                {sprite.replace('精灵', '')}
              </div>
              {ALL_TYPES.map((t) => {
                const count = getCount(t, sprite);
                return (
                  <div
                    key={`${t}-${sprite}`}
                    className="flex items-center justify-center rounded-md text-[10px] font-bold transition-colors"
                    style={{
                      backgroundColor: `var(--primary)`,
                      opacity: getOpacity(count),
                      color: count > 0 ? 'var(--primary-foreground)' : 'transparent',
                      minHeight: '28px',
                    }}
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
    </section>
  );
}
