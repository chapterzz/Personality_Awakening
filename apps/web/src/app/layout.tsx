/**
 * 根布局：元数据、字体变量、主题提供者与全局样式。
 */
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { AppThemeProvider } from '@/components/providers/app-theme-provider';
import { SiteShell } from '@/components/layout/site-shell';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: '性格星球：觉醒计划',
  description: '人格探索 Web 版（MVP）',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased font-sans`}
      >
        <AppThemeProvider>
          <SiteShell>{children}</SiteShell>
        </AppThemeProvider>
      </body>
    </html>
  );
}
