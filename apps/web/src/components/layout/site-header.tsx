/**
 * 站点顶栏：品牌名与主题切换等全局入口。
 * 2026-05-01 UI 重构：添加 SVG 星球图标 + font-display 圆润标题。
 */
import Link from 'next/link';

import { ThemeToggle } from '@/components/layout/theme-toggle';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-display font-extrabold tracking-tight text-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-5 text-primary"
            aria-hidden="true"
          >
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm0 2.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm0 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
          </svg>
          性格星球
        </Link>
        <nav className="flex items-center gap-2" aria-label="站点">
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
