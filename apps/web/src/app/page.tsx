/**
 * 站点首页：展示品牌与后续测评入口占位（T1.6 壳层验收）。
 * 2026-05-01 UI 重构：Claymorphism 风格 — Hero 渐变卡片 + 浮动 blob + 功能介绍卡。
 */
import Link from 'next/link';

import { FloatingBlobs } from '@/components/decorative/floating-blobs';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-10">
      {/* Hero 区域：渐变背景 + 浮动装饰 blob */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFF1F2] to-[#FDF2F8] p-8 sm:p-12 dark:from-[#2D1218] dark:to-[#1A0A0E]">
        <FloatingBlobs />

        <div className="relative z-10 space-y-4">
          <p className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Personality Planet · Awakening
          </p>
          <h1 className="font-display text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            性格星球：觉醒计划
          </h1>
          <p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            面向青少年的人格探索与心理学科普平台。通过趣味测评发现你的性格星球。
          </p>
        </div>
      </div>

      {/* CTA 按钮 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          className={cn(buttonVariants({ size: 'lg' }), 'flex-1 sm:flex-none')}
          href="/test/standard"
        >
          标准测评（演示）
        </Link>
        <Link
          className={cn(
            buttonVariants({ variant: 'secondary', size: 'lg' }),
            'flex-1 sm:flex-none',
          )}
          href="/test/avg"
        >
          AVG 剧情（演示）
        </Link>
        <Link
          className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'flex-1 sm:flex-none')}
          href="https://nextjs.org/docs"
          target="_blank"
          rel="noopener noreferrer"
        >
          技术栈文档
        </Link>
      </div>

      {/* 功能介绍卡片 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border-[3px] border-[var(--border)] bg-card p-6 shadow-clay">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <h3 className="font-display text-base font-bold text-foreground">标准模式</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            93 道精选题目，快速了解你的 MBTI 类型。
          </p>
        </div>
        <div className="rounded-3xl border-[3px] border-[var(--border)] bg-card p-6 shadow-clay">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#FB7185] text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <h3 className="font-display text-base font-bold text-foreground">AVG 剧情</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            沉浸式视觉小说冒险，在故事中发现自我。
          </p>
        </div>
      </div>
    </div>
  );
}
