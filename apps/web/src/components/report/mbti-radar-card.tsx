/**
 * 结果页雷达卡片：基于四维胜出差值绘制 Recharts 雷达图。
 * 2026-05-01 UI 重构：Claymorphism 卡片 + 修复颜色引用（hsl→直接 var）。
 */
'use client';

import type { MbtiScores } from '@/lib/report-scoring';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';

type RadarDatum = {
  axis: 'EI' | 'SN' | 'TF' | 'JP';
  value: number;
};

function toRadarData(scores: MbtiScores): RadarDatum[] {
  return [
    { axis: 'EI', value: scores.EI.delta },
    { axis: 'SN', value: scores.SN.delta },
    { axis: 'TF', value: scores.TF.delta },
    { axis: 'JP', value: scores.JP.delta },
  ];
}

export function MbtiRadarCard(props: { scores: MbtiScores }) {
  const data = toRadarData(props.scores);
  return (
    <section className="rounded-3xl border-[3px] border-[var(--border)] bg-card p-6 shadow-clay">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold text-foreground">四维雷达图</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {data.map((item) => (
            <span key={item.axis}>{item.axis}</span>
          ))}
        </div>
      </div>
      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 12]} tick={false} />
            <Radar
              dataKey="value"
              stroke="var(--primary)"
              fill="var(--primary)"
              fillOpacity={0.25}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
