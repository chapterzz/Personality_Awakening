/**
 * 登录 / 注册页：供看板个人对比与 T3.2 柱条高亮验收。
 */
import Link from 'next/link';
import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div>
        <Link
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex w-fit')}
          href="/"
        >
          返回首页
        </Link>
        <h1 className="mt-4 font-display text-3xl font-black text-foreground">登录 / 注册</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          登录后可于全局洞察看板查看「你的类型」高亮与个人对比。
        </p>
      </div>
      <Suspense fallback={<p className="text-muted-foreground">加载表单…</p>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
