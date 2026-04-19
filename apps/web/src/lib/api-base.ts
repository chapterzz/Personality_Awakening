/**
 * 浏览器端 API 基地址解析（默认对齐 Nest 3001，可由 `NEXT_PUBLIC_API_URL` 覆盖）。
 */
export function getBrowserApiBaseUrl(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'http://127.0.0.1:3001';
}
