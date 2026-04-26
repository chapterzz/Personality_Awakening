/**
 * 结果页雷达卡片：基于四维胜出差值绘制 Recharts 雷达图。
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
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">四维雷达图</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {data.map((item) => (
            <span key={item.axis}>{item.axis}</span>
          ))}
        </div>
      </div>
      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="axis" />
            <PolarRadiusAxis angle={90} domain={[0, 12]} tick={false} />
            <Radar
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
