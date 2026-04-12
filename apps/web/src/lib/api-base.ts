/**
 * 浏览器端使用的 API 基地址（与 Nest 默认 3001 对齐；可通过 NEXT_PUBLIC_API_URL 覆盖）。
 */
export function getBrowserApiBaseUrl(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'http://127.0.0.1:3001';
}
