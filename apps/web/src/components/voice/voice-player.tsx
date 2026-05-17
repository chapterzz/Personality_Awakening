/**
 * 语音彩蛋播放 UI（T4.3）：用户点击后 Web Audio 播放对应 MBTI 预录制 MP3。
 */
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { pickSpriteLabel } from '@/lib/poster-sprite';
import { getMbtiCopy } from '@/lib/report-copy';
import { cn } from '@/lib/utils';
import { buildVoiceAudioUrl } from '@/lib/voice-audio-path';
import type { VoiceMbtiType } from '@/lib/voice-types';
import { createVoiceWebAudioEngine } from '@/lib/voice-web-audio';

type PlayerStatus = 'idle' | 'loading' | 'playing' | 'error';

export type VoicePlayerProps = {
  mbtiType: VoiceMbtiType;
  fromPoster?: boolean;
};

/**
 * 展示类型文案与「播放精灵语音」按钮；播放前 resume AudioContext（iOS 策略）。
 */
export function VoicePlayer(props: VoicePlayerProps) {
  const { mbtiType, fromPoster = false } = props;
  const copy = getMbtiCopy(mbtiType);
  const spriteLabel = pickSpriteLabel(mbtiType);
  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const engineRef = useRef<ReturnType<typeof createVoiceWebAudioEngine> | null>(null);
  const [webAudioSupported, setWebAudioSupported] = useState(true);

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      Boolean(
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext,
      );
    setWebAudioSupported(supported);
    if (!supported) return undefined;

    const engine = createVoiceWebAudioEngine();
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handlePlay = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    setStatus('loading');
    setErrorMessage(null);
    try {
      await engine.loadAndPlay(buildVoiceAudioUrl(mbtiType));
      setStatus('playing');
    } catch (err: unknown) {
      console.warn('[voice-player] 播放失败', err);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : '播放失败，请重试');
    }
  }, [mbtiType]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <VoiceHeroSection mbtiType={mbtiType} spriteLabel={spriteLabel} />
      <VoiceCopySection copy={copy} fromPoster={fromPoster} />
      <VoiceControlsSection
        webAudioSupported={webAudioSupported}
        status={status}
        errorMessage={errorMessage}
        onPlay={() => void handlePlay()}
        onRetry={() => void handlePlay()}
      />
      <VoiceCtaSection />
      <p className="text-center text-xs text-muted-foreground">娱乐参考，非医疗诊断</p>
    </div>
  );
}

function VoiceHeroSection(props: { mbtiType: string; spriteLabel: string }) {
  const { mbtiType, spriteLabel } = props;
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 to-[#A78BFA]/10 p-8 dark:from-primary/5 dark:to-[#A78BFA]/5">
      <div className="relative z-10 flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] text-white shadow-clay-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-8"
            aria-hidden
          >
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
          </svg>
        </div>
        <h1 className="font-display text-4xl font-black tracking-tight text-foreground">
          {mbtiType}
        </h1>
        <p className="text-sm font-medium text-muted-foreground">{spriteLabel}</p>
      </div>
    </div>
  );
}

function VoiceCopySection(props: { copy: ReturnType<typeof getMbtiCopy>; fromPoster: boolean }) {
  const { copy, fromPoster } = props;
  return (
    <section className="rounded-3xl border-[3px] border-[var(--border)] bg-card p-6 shadow-clay">
      <p className="text-sm font-medium text-muted-foreground">{copy.title}</p>
      <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
        {copy.summary}
      </p>
      {fromPoster ? <p className="mt-3 text-xs text-primary">来自好友的星球分享卡</p> : null}
    </section>
  );
}

function VoiceControlsSection(props: {
  webAudioSupported: boolean;
  status: PlayerStatus;
  errorMessage: string | null;
  onPlay: () => void;
  onRetry: () => void;
}) {
  const { webAudioSupported, status, errorMessage, onPlay, onRetry } = props;
  return (
    <section className="flex flex-col gap-3">
      {!webAudioSupported ? (
        <p className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
          当前浏览器不支持 Web Audio，请升级后重试。
        </p>
      ) : (
        <button
          type="button"
          className={cn(buttonVariants({ size: 'lg' }), 'min-h-11 w-full')}
          disabled={status === 'loading'}
          onClick={onPlay}
        >
          {status === 'loading'
            ? '加载语音中…'
            : status === 'playing'
              ? '再次播放精灵语音'
              : '播放精灵语音'}
        </button>
      )}

      {status === 'error' && errorMessage ? (
        <div className="flex flex-col gap-2">
          <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-950 dark:text-red-100">
            {errorMessage}
          </p>
          <button
            type="button"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            onClick={onRetry}
          >
            重试
          </button>
        </div>
      ) : null}
    </section>
  );
}

function VoiceCtaSection() {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Link className={cn(buttonVariants({ size: 'lg' }), 'flex-1')} href="/test/standard">
        探索我的性格
      </Link>
      <Link
        className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'flex-1')}
        href="/dashboard"
      >
        全局洞察看板
      </Link>
      <Link
        className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'flex-1')}
        href="/library"
      >
        科普图书馆
      </Link>
    </div>
  );
}
