/**
 * Tailwind CSS 内容扫描路径与主题扩展（与 globals.css 中 CSS 变量对齐，供 Shadcn 组件使用）。
 * 2026-05-01 UI 重构：添加 Claymorphism 阴影、Nunito display 字体、浮动动画。
 */
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/data/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        chart: {
          1: 'var(--chart-1)',
          2: 'var(--chart-2)',
          3: 'var(--chart-3)',
          4: 'var(--chart-4)',
          5: 'var(--chart-5)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 12px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        clay: '0 6px 20px rgba(225, 29, 72, 0.1), 0 2px 6px rgba(0, 0, 0, 0.05), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
        'clay-sm':
          '0 4px 12px rgba(225, 29, 72, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
        'clay-lg':
          '0 10px 30px rgba(225, 29, 72, 0.12), 0 4px 10px rgba(0, 0, 0, 0.06), inset 0 2px 3px rgba(255, 255, 255, 0.5)',
      },
      keyframes: {
        'blob-float': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(12px, -18px) scale(1.04)' },
          '66%': { transform: 'translate(-8px, 12px) scale(0.97)' },
        },
        'blob-float-alt': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-15px, 10px) scale(0.96)' },
          '66%': { transform: 'translate(10px, -14px) scale(1.03)' },
        },
      },
      animation: {
        'blob-float': 'blob-float 12s ease-in-out infinite',
        'blob-float-alt': 'blob-float-alt 15s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
