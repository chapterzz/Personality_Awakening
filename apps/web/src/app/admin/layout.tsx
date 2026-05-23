/**
 * Admin 区布局：非登录页校验 Admin JWT，提供顶栏导航（T4.6）。
 */
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { clearAdminToken, getAdminNickname, isAdminLoggedIn } from '@/lib/admin-auth';
import { cn } from '@/lib/utils';

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';
  const [ready, setReady] = useState(isLoginPage);
  const nickname = getAdminNickname();

  useEffect(() => {
    if (isLoginPage) {
      setReady(true);
      return;
    }
    if (!isAdminLoggedIn()) {
      router.replace('/admin/login');
      return;
    }
    setReady(true);
  }, [isLoginPage, router]);

  if (!ready) {
    return <p className="text-muted-foreground">验证登录态…</p>;
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[var(--border)] bg-card px-4 py-3 shadow-clay-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            内容 CMS
          </p>
          <h1 className="font-display text-xl font-bold">性格星球 · 运营后台</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {nickname ? (
            <span className="text-sm text-muted-foreground">已登录：{nickname}</span>
          ) : null}
          <Link
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            href="/admin/questionnaires"
          >
            问卷列表
          </Link>
          <Link
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            href="/admin/avg-scripts"
          >
            AVG 脚本
          </Link>
          <Link
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            href="/admin/sprite-prompts"
          >
            精灵文案
          </Link>
          <Link
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            href="/admin/library/articles"
          >
            科普文章
          </Link>
          <button
            type="button"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            onClick={() => {
              clearAdminToken();
              router.push('/admin/login');
            }}
          >
            退出
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
