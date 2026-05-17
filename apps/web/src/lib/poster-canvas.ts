/**
 * 将测评快照绘制为竖版海报 Canvas 并导出 PNG Blob（T4.2）。
 */
import QRCode from 'qrcode';

import { getMbtiCopy } from '@/lib/report-copy';
import { buildPosterShareUrl } from '@/lib/poster-qr';
import { pickSpriteLabel } from '@/lib/poster-sprite';
import {
  formatPosterDate,
  POSTER_FONT_FAMILY,
  POSTER_SUMMARY_MAX_CHARS,
  truncatePosterSummary,
  truncatePosterNickname,
  POSTER_NICKNAME_MAX_CHARS,
} from '@/lib/poster-layout';
import {
  POSTER_EXPORT_SCALE,
  POSTER_LOGICAL_HEIGHT,
  POSTER_LOGICAL_WIDTH,
  type PosterInput,
} from '@/lib/poster-types';

/** 海报深色主题色（对齐 globals.css dark + 分享对比度） */
const POSTER_COLORS = {
  bgTop: '#1A0A0E',
  bgMid: '#2D1218',
  text: '#FECDD3',
  textBright: '#FFFFFF',
  muted: '#9CA3AF',
  accentRose: '#E11D48',
  accentPurple: '#7C3AED',
  accentLavender: '#A78BFA',
  blobPurple: 'rgba(124, 58, 237, 0.18)',
  blobRose: 'rgba(225, 29, 72, 0.14)',
} as const;

/**
 * 将 data URL 加载为 HTMLImageElement（Canvas drawImage 用）。
 */
function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('poster_qr_image_load_failed'));
    img.src = dataUrl;
  });
}

/**
 * 在圆形精灵区内绘制渐变圆与星形（MVP，无位图资源）。
 */
function drawSpriteOrb(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
): void {
  const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  grad.addColorStop(0, POSTER_COLORS.accentLavender);
  grad.addColorStop(1, POSTER_COLORS.accentPurple);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.save();
  ctx.translate(cx, cy);
  const starScale = (radius * 2) / 24;
  ctx.scale(starScale, starScale);
  ctx.translate(-12, -12);
  ctx.fillStyle = POSTER_COLORS.textBright;
  ctx.beginPath();
  ctx.moveTo(12, 2);
  ctx.lineTo(14.4, 9.4);
  ctx.lineTo(22, 9.4);
  ctx.lineTo(15.8, 13.9);
  ctx.lineTo(18.2, 21.3);
  ctx.lineTo(12, 16.8);
  ctx.lineTo(5.8, 21.3);
  ctx.lineTo(8.2, 13.9);
  ctx.lineTo(2, 9.4);
  ctx.lineTo(9.6, 9.4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * 绘制装饰性背景光斑。
 */
function drawDecorativeBlobs(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = POSTER_COLORS.blobPurple;
  ctx.beginPath();
  ctx.arc(180, 280, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = POSTER_COLORS.blobRose;
  ctx.beginPath();
  ctx.arc(920, 420, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = POSTER_COLORS.blobPurple;
  ctx.beginPath();
  ctx.arc(860, 1680, 200, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 将 PosterInput 绘制到 Canvas，导出倍率为 POSTER_EXPORT_SCALE。
 */
export async function renderPosterToCanvas(input: PosterInput): Promise<HTMLCanvasElement> {
  const mbtiType = input.result.mbti_type.toUpperCase();
  const copy = getMbtiCopy(mbtiType);
  const spriteLabel = pickSpriteLabel(mbtiType);
  const summary = truncatePosterSummary(copy.summary, POSTER_SUMMARY_MAX_CHARS);
  const nickname = truncatePosterNickname(input.nickname, POSTER_NICKNAME_MAX_CHARS);
  const dateLabel = formatPosterDate(input.generated_at);
  const shareUrl = buildPosterShareUrl(input.origin, mbtiType);
  const qrDataUrl = await QRCode.toDataURL(shareUrl, {
    width: 320,
    margin: 1,
    color: { dark: '#1A0A0E', light: '#FFFFFF' },
  });
  const qrImage = await loadImageFromDataUrl(qrDataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = POSTER_LOGICAL_WIDTH * POSTER_EXPORT_SCALE;
  canvas.height = POSTER_LOGICAL_HEIGHT * POSTER_EXPORT_SCALE;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('poster_canvas_context_unavailable');
  }

  ctx.scale(POSTER_EXPORT_SCALE, POSTER_EXPORT_SCALE);
  ctx.font = `400 28px ${POSTER_FONT_FAMILY}`;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, POSTER_LOGICAL_HEIGHT);
  bgGrad.addColorStop(0, POSTER_COLORS.bgTop);
  bgGrad.addColorStop(0.45, POSTER_COLORS.bgMid);
  bgGrad.addColorStop(1, POSTER_COLORS.bgTop);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, POSTER_LOGICAL_WIDTH, POSTER_LOGICAL_HEIGHT);

  drawDecorativeBlobs(ctx);

  ctx.textAlign = 'center';
  ctx.fillStyle = POSTER_COLORS.accentRose;
  ctx.font = `700 40px ${POSTER_FONT_FAMILY}`;
  ctx.fillText('性格星球：觉醒计划', POSTER_LOGICAL_WIDTH / 2, 100);

  ctx.fillStyle = POSTER_COLORS.muted;
  ctx.font = `500 32px ${POSTER_FONT_FAMILY}`;
  ctx.fillText('我的 MBTI 探索卡', POSTER_LOGICAL_WIDTH / 2, 150);

  const spriteCy = 480;
  drawSpriteOrb(ctx, POSTER_LOGICAL_WIDTH / 2, spriteCy, 130);

  ctx.fillStyle = POSTER_COLORS.textBright;
  ctx.font = `900 148px ${POSTER_FONT_FAMILY}`;
  ctx.fillText(mbtiType, POSTER_LOGICAL_WIDTH / 2, spriteCy + 280);

  ctx.fillStyle = POSTER_COLORS.accentLavender;
  ctx.font = `700 44px ${POSTER_FONT_FAMILY}`;
  ctx.fillText(spriteLabel, POSTER_LOGICAL_WIDTH / 2, spriteCy + 350);

  ctx.fillStyle = POSTER_COLORS.text;
  ctx.font = `400 36px ${POSTER_FONT_FAMILY}`;
  ctx.fillText(summary, POSTER_LOGICAL_WIDTH / 2, spriteCy + 420);

  ctx.fillStyle = POSTER_COLORS.muted;
  ctx.font = `400 30px ${POSTER_FONT_FAMILY}`;
  ctx.fillText(`${nickname} · 完成于 ${dateLabel}`, POSTER_LOGICAL_WIDTH / 2, spriteCy + 490);

  const qrSize = 280;
  const qrX = (POSTER_LOGICAL_WIDTH - qrSize) / 2;
  const qrY = 1520;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 24);
  ctx.fill();
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = POSTER_COLORS.text;
  ctx.font = `500 32px ${POSTER_FONT_FAMILY}`;
  ctx.fillText('扫码探索你的星球', POSTER_LOGICAL_WIDTH / 2, qrY + qrSize + 56);

  ctx.fillStyle = POSTER_COLORS.muted;
  ctx.font = `400 24px ${POSTER_FONT_FAMILY}`;
  ctx.fillText('娱乐参考，非医疗诊断', POSTER_LOGICAL_WIDTH / 2, POSTER_LOGICAL_HEIGHT - 48);

  return canvas;
}

/**
 * 将 Canvas 转为 PNG Blob。
 */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('poster_to_blob_failed'))),
      'image/png',
    );
  });
}
