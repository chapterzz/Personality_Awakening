/**
 * 解析海报二维码使用的站点 origin（T4.2 / T4.3）。
 * 优先 NEXT_PUBLIC_APP_URL；本地 loopback 时尝试 dev API 解析局域网 IP，便于手机扫码。
 */

/**
 * 是否为 loopback 主机名（手机扫码无法访问）。
 */
export function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

/**
 * @param origin 完整 origin，如 http://127.0.0.1:3000
 */
export function isLoopbackOrigin(origin: string): boolean {
  try {
    return isLoopbackHost(new URL(origin).hostname);
  } catch {
    return false;
  }
}

/**
 * @param fallbackOrigin 浏览器当前 origin（如 window.location.origin）
 * @returns 去掉末尾斜杠的站点根 URL
 */
export function resolvePosterAppOrigin(fallbackOrigin: string): string {
  const env = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_APP_URL?.trim() : undefined;
  const base = env && env.length > 0 ? env : fallbackOrigin;
  return base.replace(/\/+$/, '');
}

/**
 * 异步解析海报 QR origin：在开发环境且当前为 loopback 时，请求 `/api/dev-poster-origin` 获取局域网地址。
 */
export async function resolvePosterAppOriginAsync(fallbackOrigin: string): Promise<{
  origin: string;
  /** 是否通过局域网 IP 替代了 loopback（用于 UI 提示） */
  usedLanFallback: boolean;
}> {
  const env = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_APP_URL?.trim() : undefined;
  if (env && env.length > 0) {
    return { origin: env.replace(/\/+$/, ''), usedLanFallback: false };
  }

  const normalizedFallback = fallbackOrigin.replace(/\/+$/, '');
  if (!isLoopbackOrigin(normalizedFallback)) {
    return { origin: normalizedFallback, usedLanFallback: false };
  }

  if (process.env.NODE_ENV === 'production') {
    return { origin: normalizedFallback, usedLanFallback: false };
  }

  try {
    const res = await fetch('/api/dev-poster-origin', { cache: 'no-store' });
    if (res.ok) {
      const body = (await res.json()) as { origin?: string | null };
      if (body.origin && !isLoopbackOrigin(body.origin)) {
        return { origin: body.origin.replace(/\/+$/, ''), usedLanFallback: true };
      }
    }
  } catch {
    /* 开发辅助接口不可用时回退 */
  }

  return { origin: normalizedFallback, usedLanFallback: false };
}
