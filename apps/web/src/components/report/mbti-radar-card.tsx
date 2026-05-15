/**
 * 结果页雷达卡片：基于四维得分绘制 Recharts 雷达图。
 * 使用两侧原始分数显示方向性差异，正负值区分偏向。
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
  axis: string;
  value: number;
};

/**
 * 将四维分数转换为雷达图数据。
 * 使用 winner 对应的分数，正负值区分偏向：
 * - 正数：偏向第一个侧面（E/S/T/J）
 * - 负数：偏向第二个侧面（I/N/F/P）
 */
function toRadarData(scores: MbtiScores): RadarDatum[] {
  return [
    { axis: 'EI', value: scores.EI.winner === 'E' ? scores.EI.E : -scores.EI.I },
    { axis: 'SN', value: scores.SN.winner === 'S' ? scores.SN.S : -scores.SN.N },
    { axis: 'TF', value: scores.TF.winner === 'T' ? scores.TF.T : -scores.TF.F },
    { axis: 'JP', value: scores.JP.winner === 'J' ? scores.JP.J : -scores.JP.P },
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
            <PolarRadiusAxis angle={90} domain={[-15, 15]} tick={false} />
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
