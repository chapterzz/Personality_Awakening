/**
 * 结果页解析卡片：根据 MBTI 类型展示标题、概述与行动建议。
 * 2026-05-01 UI 重构：Claymorphism 卡片 + 彩色圆点列表 + font-display 标题。
 */
import { getMbtiCopy } from '@/lib/report-copy';

export function MbtiAnalysisCard(props: { mbtiType: string }) {
  const copy = getMbtiCopy(props.mbtiType);
  return (
    <section className="rounded-3xl border-[3px] border-[var(--border)] bg-card p-6 shadow-clay">
      <h2 className="text-lg font-display font-bold text-foreground">{copy.title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{copy.summary}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-foreground">优势亮点</p>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {copy.strengths.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">行动建议</p>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {copy.suggestions.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
