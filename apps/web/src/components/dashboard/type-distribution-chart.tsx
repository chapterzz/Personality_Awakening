/**
 * 16 型人格人数分布柱状图：使用 Recharts BarChart 按人数降序展示。
 */
'use client';

import type { TypeDistributionItem } from '@/lib/dashboard-api';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function TypeDistributionChart(props: {
  data: TypeDistributionItem[];
  highlightType?: string | null;
}) {
  return (
    <section className="rounded-3xl border-[3px] border-[var(--border)] bg-card p-6 shadow-clay">
      <h2 className="text-lg font-display font-bold text-foreground">16 型人格分布</h2>
      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={props.data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
            <XAxis
              dataKey="type"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: 'var(--card)',
                border: '2px solid var(--border)',
                borderRadius: '12px',
                fontSize: '13px',
              }}
            />
            <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
