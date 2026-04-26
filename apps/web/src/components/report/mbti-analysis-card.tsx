/**
 * 结果页解析卡片：根据 MBTI 类型展示标题、概述与行动建议。
 */
import { getMbtiCopy } from '@/lib/report-copy';

export function MbtiAnalysisCard(props: { mbtiType: string }) {
  const copy = getMbtiCopy(props.mbtiType);
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">{copy.title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{copy.summary}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-foreground">优势亮点</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {copy.strengths.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">行动建议</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {copy.suggestions.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
