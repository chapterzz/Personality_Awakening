/**
 * className 拼接工具：过滤假值，便于 Tailwind 与条件类组合。
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}
