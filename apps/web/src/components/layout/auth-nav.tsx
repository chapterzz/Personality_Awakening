/**
 * 顶栏登录态：未登录显示「登录」；已登录显示昵称与退出。
 */
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import {
  AUTH_CHANGED_EVENT,
  clearAccessToken,
  getAccessToken,
  getStoredNickname,
} from '@/lib/auth-token';
import { cn } from '@/lib/utils';

export function AuthNav() {
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => {
    function sync() {
      const token = getAccessToken();
      setNickname(token ? getStoredNickname() : null);
    }
    sync();
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (!nickname) {
    return (
      <Link
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        href="/login?redirect=/dashboard"
      >
        登录
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[8rem] truncate text-sm text-muted-foreground sm:inline">
        {nickname}
      </span>
      <button
        type="button"
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
        onClick={() => clearAccessToken()}
      >
        退出
      </button>
    </div>
  );
}
