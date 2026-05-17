/**
 * 结果海报：输入类型与画布尺寸常量（T4.2）。
 */
import type { MbtiMode, MbtiReportResult } from '@/lib/report-scoring';

/** 海报绘制入参：来自报告快照 + 昵称与站点 origin */
export type PosterInput = {
  mode: MbtiMode;
  result: MbtiReportResult;
  generated_at: string;
  nickname: string;
  origin: string;
};

/** 逻辑画布宽（竖版 9:16） */
export const POSTER_LOGICAL_WIDTH = 1080;
/** 逻辑画布高 */
export const POSTER_LOGICAL_HEIGHT = 1920;
/** 导出像素倍率，保证朋友圈清晰度 */
export const POSTER_EXPORT_SCALE = 2;
