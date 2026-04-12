/** 拼接 className，过滤假值（便于与 Tailwind / 条件类组合） */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}
