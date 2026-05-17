/**
 * 开发环境：返回本机局域网 IPv4，供海报二维码在手机扫码时使用（非生产）。
 */
import { NextResponse } from 'next/server';

import { pickDevLanIPv4 } from '@/lib/dev-lan-ip';

const WEB_DEV_PORT = process.env.PORT ?? '3000';

/**
 * GET /api/dev-poster-origin → { origin: "http://192.168.x.x:3000" }
 */
export function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not_available' }, { status: 404 });
  }

  const ip = pickDevLanIPv4();
  if (!ip) {
    return NextResponse.json({
      origin: null,
      hint: '未检测到局域网 IPv4，请在 .env.local 设置 NEXT_PUBLIC_APP_URL',
    });
  }

  return NextResponse.json({
    origin: `http://${ip}:${WEB_DEV_PORT}`,
  });
}
