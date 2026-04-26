/**
 * MBTI 评分领域类型：输入信号、维度得分与最终类型。
 */

export type MbtiMode = 'STANDARD' | 'AVG';

export type MbtiDimension = 'EI' | 'SN' | 'TF' | 'JP';

export type MbtiSide = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

export type MbtiSignal = {
  dimension: MbtiDimension;
  side: MbtiSide;
  weight: 1 | 2 | 3;
};

export type MbtiDimensionScore = {
  winner: string;
  delta: number;
} & Record<string, number>;

export type MbtiScores = {
  EI: { E: number; I: number; winner: 'E' | 'I'; delta: number };
  SN: { S: number; N: number; winner: 'S' | 'N'; delta: number };
  TF: { T: number; F: number; winner: 'T' | 'F'; delta: number };
  JP: { J: number; P: number; winner: 'J' | 'P'; delta: number };
};

export type MbtiComputeResult = {
  mode: MbtiMode;
  scores: MbtiScores;
  mbti_type: string;
};
