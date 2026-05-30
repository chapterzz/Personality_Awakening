/**
 * 科普图书馆 Hero：标题与伦理免责声明。
 */
'use client';

import { FloatingBlobs } from '@/components/decorative/floating-blobs';
import { LIBRARY_ETHICS_DISCLAIMER } from '@/lib/library-labels';

export function LibraryHero() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 to-[#A78BFA]/10 p-6 dark:from-primary/5 dark:to-[#A78BFA]/5">
      <FloatingBlobs variant="light" />
      <div className="relative z-10 space-y-3">
        <p className="text-sm font-medium text-muted-foreground">心理学科普</p>
        <h1 className="font-display text-4xl font-black tracking-tight text-foreground sm:text-5xl">
          科普图书馆
        </h1>
        <p className="text-base text-muted-foreground">
          了解 MBTI 的科学边界、标签化风险，以及如何用更稳妥的方式看待人格测评。
        </p>
        <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
          {LIBRARY_ETHICS_DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
