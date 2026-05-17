/**
 * 海报布局常量、昵称解析与文案截断（T4.2）。
 */

/** 游客默认昵称（N-A） */
export const GUEST_POSTER_NICKNAME = '星球探索者';

/** Canvas 字体栈，与全站中文友好字体一致 */
export const POSTER_FONT_FAMILY =
  '"Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';

/** 海报 summary 最大字符数 */
export const POSTER_SUMMARY_MAX_CHARS = 40;

/** 海报昵称最大字符数 */
export const POSTER_NICKNAME_MAX_CHARS = 16;

/**
 * 解析海报展示昵称：登录用存储昵称，游客为「星球探索者」。
 * @param storedNickname getStoredNickname() 返回值
 */
export function resolvePosterNickname(storedNickname: string | null): string {
  const raw = storedNickname?.trim();
  const name = raw && raw.length > 0 ? raw : GUEST_POSTER_NICKNAME;
  return truncatePosterNickname(name, POSTER_NICKNAME_MAX_CHARS);
}

/**
 * 截断过长文案，末尾加省略号。
 */
export function truncatePosterSummary(text: string, maxChars: number): string {
  const t = text.trim();
  if (t.length <= maxChars) return t;
  return `${t.slice(0, maxChars)}…`;
}

/**
 * 截断过长昵称。
 */
export function truncatePosterNickname(text: string, maxChars: number): string {
  return truncatePosterSummary(text, maxChars);
}

/**
 * 将 ISO 时间格式化为海报日期行。
 */
export function formatPosterDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}
