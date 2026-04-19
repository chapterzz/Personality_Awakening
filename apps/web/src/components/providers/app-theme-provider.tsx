/**
 * 客户端主题提供者：为 next-themes 包裹子树，支持 class 策略与系统偏好。
 */
'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

type AppThemeProviderProps = {
  children: ReactNode;
};

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
