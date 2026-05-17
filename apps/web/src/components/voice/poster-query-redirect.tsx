/**
 * 首页旧海报 Q-A 参数兼容：/?from=poster&ref= 重定向至 /voice/[type]（T4.3）。
 */
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { buildVoicePathFromPosterRef, parsePosterLandingQuery } from '@/lib/poster-landing';

/**
 * 无 UI；命中旧二维码 query 时 router.replace 到语音页。
 */
export function PosterQueryRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const parsed = parsePosterLandingQuery({
      from: searchParams.get('from'),
      ref: searchParams.get('ref'),
    });
    if (parsed) {
      router.replace(buildVoicePathFromPosterRef(parsed.type));
    }
  }, [router, searchParams]);

  return null;
}
