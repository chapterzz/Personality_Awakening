/**
 * 站点顶栏：品牌名与主题切换等全局入口。
 */
import Link from 'next/link';

import { ThemeToggle } from '@/components/layout/theme-toggle';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="text-base font-semibold tracking-tight text-foreground">
          性格星球
        </Link>
        <nav className="flex items-center gap-2" aria-label="站点">
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
