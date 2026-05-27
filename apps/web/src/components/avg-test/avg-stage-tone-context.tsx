/**
 * AVG 舞台背景冷暖 Context：供气泡等子组件按反差规则着色文字。
 */
'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { AvgBgTone } from '@/lib/avg-background-tone';

const AvgStageToneContext = createContext<AvgBgTone>('neutral');

type AvgStageToneProviderProps = {
  tone: AvgBgTone;
  children: ReactNode;
};

export function AvgStageToneProvider({ tone, children }: AvgStageToneProviderProps) {
  return <AvgStageToneContext.Provider value={tone}>{children}</AvgStageToneContext.Provider>;
}

/** 读取当前舞台背景冷暖（默认 neutral） */
export function useAvgStageTone(): AvgBgTone {
  return useContext(AvgStageToneContext);
}
