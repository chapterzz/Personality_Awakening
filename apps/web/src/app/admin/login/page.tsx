/**
 * Admin 登录页：仅允许 role=ADMIN 的用户进入 CMS（T4.6）。
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { loginUser } from '@/lib/auth-api';
import { setAdminToken } from '@/lib/admin-auth';
import { cn } from '@/lib/utils';

const inputClassName =
  'w-full rounded-2xl border-2 border-[var(--border)] bg-card px-4 py-2.5 text-sm text-foreground shadow-clay-sm outline-none focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50';

export default function AdminLoginPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await loginUser(nickname.trim(), password);
      if (result.user.role !== 'ADMIN') {
        setError('该账号无管理员权限，请使用 ADMIN 账号登录。');
        return;
      }
      setAdminToken(result.access_token, result.user.nickname);
      router.push('/admin/questionnaires');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'login_failed';
      if (msg === 'invalid_credentials') {
        setError('昵称或密码错误。');
      } else {
        setError(`登录失败：${msg}`);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div>
        <Link
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex w-fit')}
          href="/"
        >
          返回首页
        </Link>
        <h1 className="mt-4 font-display text-3xl font-black text-foreground">管理员登录</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          题库 CMS 入口。演示账号：昵称 <strong>ppa-admin</strong>，密码见{' '}
          <code className="rounded bg-muted px-1">SEED_ADMIN_PASSWORD</code>（默认 ppa-admin-dev）。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">管理员昵称</span>
          <input
            className={inputClassName}
            autoComplete="username"
            required
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">密码</span>
          <input
            className={inputClassName}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-950 dark:text-red-100">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className={cn(buttonVariants({ size: 'lg' }), 'w-full')}
        >
          {pending ? '登录中…' : '进入管理后台'}
        </button>
      </form>
    </div>
  );
}
