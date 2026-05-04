/**
 * 根布局：元数据、字体变量、主题提供者与全局样式。
 * 2026-05-01 UI 重构：替换 Geist 为 Nunito（标题）+ DM Sans（正文）+ JetBrains Mono。
 */
import type { Metadata } from 'next';
import { Nunito, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AppThemeProvider } from '@/components/providers/app-theme-provider';
import { SiteShell } from '@/components/layout/site-shell';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['700', '800', '900'],
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
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
        className={`${nunito.variable} ${dmSans.variable} ${jetbrainsMono.variable} min-h-screen antialiased font-sans`}
      >
        <AppThemeProvider>
          <SiteShell>{children}</SiteShell>
        </AppThemeProvider>
      </body>
    </html>
  );
}
