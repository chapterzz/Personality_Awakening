/**
 * 海报 PNG 下载、文件名与可选 Web Share（T4.2）。
 */

/**
 * 触发浏览器下载 Blob 为文件。
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * 生成下载文件名：ppa-poster-{TYPE}-{yyyyMMdd}.png
 */
export function buildPosterFilename(mbtiType: string, generatedAt: string): string {
  const day = generatedAt.slice(0, 10).replace(/-/g, '');
  return `ppa-poster-${mbtiType.toUpperCase()}-${day}.png`;
}

/**
 * 环境支持时通过系统分享面板分享 PNG（失败返回 false）。
 */
export async function sharePosterBlob(blob: Blob, mbtiType: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) return false;
  const file = new File([blob], buildPosterFilename(mbtiType, new Date().toISOString()), {
    type: 'image/png',
  });
  if (navigator.canShare && !navigator.canShare({ files: [file] })) return false;
  await navigator.share({
    files: [file],
    title: `我的 ${mbtiType.toUpperCase()} 探索卡`,
    text: '来自性格星球：觉醒计划',
  });
  return true;
}
