/**
 * 16 型人格人数分布柱状图：Recharts BarChart 按人数降序展示；登录用户高亮自己的类型。
 */
'use client';

import { useMemo } from 'react';
import type { TypeDistributionItem } from '@/lib/dashboard-api';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

/**
 * 解析柱条填充色：高亮类型使用 chart-3，其余使用 primary（深浅主题由 CSS 变量控制）。
 */
export function resolveTypeBarFill(type: string, highlightType?: string | null): string {
  if (highlightType && type === highlightType) return 'var(--chart-3)';
  return 'var(--primary)';
}

/** 按人数降序排列类型分布（与后端聚合顺序一致，防御 API 变更） */
function sortByCountDesc(data: TypeDistributionItem[]): TypeDistributionItem[] {
  return [...data].sort((a, b) => b.count - a.count);
}

export function TypeDistributionChart(props: {
  data: TypeDistributionItem[];
  highlightType?: string | null;
}) {
  const chartData = useMemo(() => sortByCountDesc(props.data), [props.data]);
  const highlightType = props.highlightType ?? null;

  return (
    <section className="rounded-3xl border-[3px] border-[var(--border)] bg-card p-6 shadow-clay">
      <h2 className="text-lg font-display font-bold text-foreground">16 型人格分布</h2>
      {highlightType ? (
        <p className="mt-1 text-sm text-muted-foreground">
          高亮为你的类型：
          <span className="font-bold" style={{ color: 'var(--chart-3)' }}>
            {highlightType}
          </span>
        </p>
      ) : null}
      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
            <XAxis
              dataKey="type"
              interval={0}
              height={50}
              tick={(tickProps) => {
                const value = String(tickProps.payload?.value ?? '');
                const isHighlight = highlightType === value;
                return (
                  <text
                    x={tickProps.x}
                    y={tickProps.y}
                    textAnchor="end"
                    fill={isHighlight ? 'var(--chart-3)' : 'var(--muted-foreground)'}
                    fontSize={10}
                    fontWeight={isHighlight ? 700 : 400}
                    transform={`rotate(-45, ${tickProps.x}, ${tickProps.y})`}
                  >
                    {value}
                  </text>
                );
              }}
            />
            <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: 'var(--card)',
                border: '2px solid var(--border)',
                borderRadius: '12px',
                fontSize: '13px',
                color: 'var(--foreground)',
              }}
              labelFormatter={(label) => {
                const text = String(label);
                if (highlightType && text === highlightType) {
                  return `${text}（你的类型）`;
                }
                return text;
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} fillOpacity={0.85}>
              {chartData.map((entry) => (
                <Cell key={entry.type} fill={resolveTypeBarFill(entry.type, highlightType)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
