/**
 * 结果页精灵展示卡：按 MBTI 类型显示昵称标签与性格一句话。
 */
import { getMbtiCopy } from '@/lib/report-copy';

function pickSpriteLabel(mbtiType: string): string {
  const first = mbtiType.toUpperCase()[0];
  if (first === 'E') return '曦光领航精灵';
  if (first === 'I') return '月影探索精灵';
  return '星环守护精灵';
}

export function SpriteProfileCard(props: { mbtiType: string }) {
  const type = props.mbtiType.toUpperCase();
  const copy = getMbtiCopy(type);
  const spriteLabel = pickSpriteLabel(type);
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">人格精灵</p>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-xl">
          ✨
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">
            {type} · {spriteLabel}
          </p>
          <p className="text-sm text-muted-foreground">{copy.summary}</p>
        </div>
      </div>
    </section>
  );
}
