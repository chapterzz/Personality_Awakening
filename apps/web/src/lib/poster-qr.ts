/**
 * 构造海报二维码指向的 H5 URL（T4.2；T4.3 L3 指向 /voice/[type]）。
 */

/**
 * @param origin 站点根 URL（无末尾斜杠）
 * @param mbtiType MBTI 四字母类型
 */
export function buildPosterShareUrl(origin: string, mbtiType: string): string {
  const base = origin.replace(/\/+$/, '');
  const type = mbtiType.toUpperCase();
  return `${base}/voice/${encodeURIComponent(type)}?from=poster`;
}
