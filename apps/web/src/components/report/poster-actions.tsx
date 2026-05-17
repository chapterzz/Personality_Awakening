/**
 * 报告页海报操作区：生成、预览、下载与可选系统分享（T4.2）。
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { getStoredNickname } from '@/lib/auth-token';
import { isLoopbackOrigin, resolvePosterAppOriginAsync } from '@/lib/poster-app-url';
import { canvasToPngBlob, renderPosterToCanvas } from '@/lib/poster-canvas';
import { buildPosterFilename, downloadBlob, sharePosterBlob } from '@/lib/poster-download';
import { resolvePosterNickname } from '@/lib/poster-layout';
import type { ReportSnapshot } from '@/lib/report-storage';

type PosterActionsProps = {
  snapshot: ReportSnapshot;
};

/**
 * 报告页内嵌海报生成与下载 UI。
 */
export function PosterActions({ snapshot }: PosterActionsProps) {
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const [qrOriginHint, setQrOriginHint] = useState<string | null>(null);
  const posterBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleGenerate = useCallback(async () => {
    if (typeof document === 'undefined' || !document.createElement('canvas').getContext('2d')) {
      setError('当前浏览器不支持海报生成');
      return;
    }
    setBusy(true);
    setError(null);
    setShareHint(null);
    setQrOriginHint(null);
    try {
      const nickname = resolvePosterNickname(getStoredNickname());
      const { origin, usedLanFallback } = await resolvePosterAppOriginAsync(window.location.origin);
      if (usedLanFallback) {
        setQrOriginHint(
          `二维码已使用局域网地址（${origin}）。请确保手机与电脑在同一 WiFi，并已用 pnpm dev:web 启动（监听 0.0.0.0）。`,
        );
      } else if (isLoopbackOrigin(origin)) {
        setQrOriginHint(
          '二维码仍为 127.0.0.1，手机无法打开。请在项目根 .env.local 设置 NEXT_PUBLIC_APP_URL=http://你的局域网IP:3000 后重新生成海报。',
        );
      }
      const canvas = await renderPosterToCanvas({
        mode: snapshot.mode,
        result: snapshot.result,
        generated_at: snapshot.generated_at,
        nickname,
        origin,
      });
      const blob = await canvasToPngBlob(canvas);
      posterBlobRef.current = blob;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch {
      setError('海报生成失败，请重试');
    } finally {
      setBusy(false);
    }
  }, [snapshot, previewUrl]);

  const handleDownload = useCallback(() => {
    const blob = posterBlobRef.current;
    if (!blob) return;
    downloadBlob(blob, buildPosterFilename(snapshot.result.mbti_type, snapshot.generated_at));
    setShareHint('已保存 PNG。可在微信中选择相册图片分享到朋友圈。');
  }, [snapshot]);

  const handleShare = useCallback(async () => {
    const blob = posterBlobRef.current;
    if (!blob) return;
    try {
      const ok = await sharePosterBlob(blob, snapshot.result.mbti_type);
      if (!ok) {
        handleDownload();
        return;
      }
      setShareHint('已通过系统分享面板发送。');
    } catch {
      handleDownload();
    }
  }, [snapshot, handleDownload]);

  const hasPreview = Boolean(previewUrl);

  return (
    <section className="rounded-3xl border-[3px] border-[var(--border)] bg-card p-6 shadow-clay">
      <p className="text-sm font-medium text-muted-foreground">分享海报</p>
      <p className="mt-1 text-sm text-muted-foreground">
        生成竖版探索卡，含你的 MBTI 类型与站点二维码，可保存后分享到朋友圈。
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => void handleGenerate()} type="button">
          {busy ? '生成中…' : hasPreview ? '重新生成海报' : '生成分享海报'}
        </Button>
        {hasPreview ? (
          <>
            <Button disabled={busy} onClick={handleDownload} type="button" variant="outline">
              下载海报
            </Button>
            <Button
              disabled={busy}
              onClick={() => void handleShare()}
              type="button"
              variant="secondary"
            >
              分享
            </Button>
          </>
        ) : null}
      </div>
      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {qrOriginHint ? (
        <p className="mt-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
          {qrOriginHint}
        </p>
      ) : null}
      {shareHint ? <p className="mt-3 text-sm text-muted-foreground">{shareHint}</p> : null}
      {previewUrl ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={`${snapshot.result.mbti_type} 探索卡海报预览`}
            className="max-h-[min(70vh,640px)] w-auto max-w-full rounded-2xl border border-[var(--border)] shadow-clay-sm"
            src={previewUrl}
          />
          <p className="text-center text-xs text-muted-foreground">
            iOS Safari 若无法直接下载，可长按预览图保存到相册。
          </p>
        </div>
      ) : null}
    </section>
  );
}
