/**
 * 登录 / 注册表单：写入 JWT；注册可选写入演示 TestResult 供看板验收。
 */
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { loginUser, registerUser, registerWithDemoTestResult } from '@/lib/auth-api';
import { setAccessToken } from '@/lib/auth-token';
import { cn } from '@/lib/utils';

const DEMO_MBTI_TYPES = ['INFP', 'ENFP', 'INTJ', 'ENTP', 'ISFJ', 'ESTJ'] as const;

const inputClassName =
  'w-full rounded-2xl border-2 border-[var(--border)] bg-card px-4 py-2.5 text-sm text-foreground shadow-clay-sm outline-none focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50';

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/dashboard';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [withDemoResult, setWithDemoResult] = useState(true);
  const [demoMbtiType, setDemoMbtiType] = useState<string>('INFP');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result =
        mode === 'login'
          ? await loginUser(nickname.trim(), password)
          : withDemoResult
            ? await registerWithDemoTestResult(nickname.trim(), password, demoMbtiType)
            : await registerUser(nickname.trim(), password);

      setAccessToken(result.access_token, result.user.nickname);
      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'auth_failed';
      if (msg === 'nickname_taken') {
        setError('昵称已被占用，请换一个或使用登录。');
      } else if (msg === 'invalid_credentials') {
        setError('昵称或密码错误。');
      } else {
        setError(`操作失败：${msg}`);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="flex gap-2 rounded-2xl border-2 border-[var(--border)] bg-muted/40 p-1">
        <button
          type="button"
          className={cn(
            'flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
            mode === 'login' ? 'bg-card shadow-clay-sm text-foreground' : 'text-muted-foreground',
          )}
          onClick={() => setMode('login')}
        >
          登录
        </button>
        <button
          type="button"
          className={cn(
            'flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
            mode === 'register'
              ? 'bg-card shadow-clay-sm text-foreground'
              : 'text-muted-foreground',
          )}
          onClick={() => setMode('register')}
        >
          注册
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">昵称</span>
          <input
            className={inputClassName}
            autoComplete="username"
            minLength={2}
            maxLength={32}
            required
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="2–32 个字符"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">密码</span>
          <input
            className={inputClassName}
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 8 位"
          />
        </label>

        {mode === 'register' ? (
          <div className="space-y-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-muted/20 p-4">
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={withDemoResult}
                onChange={(e) => setWithDemoResult(e.target.checked)}
              />
              <span className="text-sm text-muted-foreground">
                注册时写入演示测评结果（用于看板「你的类型」高亮验收）
              </span>
            </label>
            {withDemoResult ? (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">演示 MBTI 类型</span>
                <select
                  className={inputClassName}
                  value={demoMbtiType}
                  onChange={(e) => setDemoMbtiType(e.target.value)}
                >
                  {DEMO_MBTI_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        ) : null}

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
          {pending ? '处理中…' : mode === 'login' ? '登录' : '注册'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        已有演示数据？可先运行 <code className="rounded bg-muted px-1">pnpm db:seed:dashboard</code>
        ，再用昵称 <strong>seed-dashboard-000</strong>、密码 <strong>seed-dashboard-demo</strong>{' '}
        登录。
      </p>
    </div>
  );
}
