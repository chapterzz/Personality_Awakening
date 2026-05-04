/**
 * 结果页精灵展示卡：按 MBTI 类型显示昵称标签与性格一句话。
 * 2026-05-01 UI 重构：Claymorphism 卡片 + SVG 星星图标替代 emoji + 紫色渐变头像。
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
    <section className="rounded-3xl border-[3px] border-[var(--border)] bg-card p-6 shadow-clay">
      <p className="text-sm font-medium text-muted-foreground">人格精灵</p>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] text-white shadow-clay-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-6"
          >
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
          </svg>
        </div>
        <div>
          <p className="text-base font-display font-bold text-foreground">
            {type} · {spriteLabel}
          </p>
          <p className="text-sm text-muted-foreground">{copy.summary}</p>
        </div>
      </div>
    </section>
  );
}
