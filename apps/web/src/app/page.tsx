/**
 * 站点首页：展示品牌与后续测评入口占位（T1.6 壳层验收）。
 */
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Personality Planet · Awakening</p>
        <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          性格星球：觉醒计划
        </h1>
        <p className="max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
          面向青少年的人格探索与心理学科普平台。测评与班级功能将在后续里程碑中陆续开放。
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link className={cn(buttonVariants())} href="/test/standard">
          标准测评（演示）
        </Link>
        <Link
          className={cn(buttonVariants({ variant: 'outline' }))}
          href="https://nextjs.org/docs"
          target="_blank"
          rel="noopener noreferrer"
        >
          技术栈文档
        </Link>
      </div>
    </div>
  );
}
