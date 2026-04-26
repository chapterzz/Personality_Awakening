/**
 * MBTI 评分服务：将标准化信号累加为四维分值并映射 16 型。
 */
import { BadRequestException, Injectable } from '@nestjs/common';
import { MbtiComputeResult, MbtiMode, MbtiSignal, MbtiSide } from './scoring.types';

const SIDE_BY_DIMENSION: Record<string, readonly [MbtiSide, MbtiSide]> = {
  EI: ['E', 'I'],
  SN: ['S', 'N'],
  TF: ['T', 'F'],
  JP: ['J', 'P'],
} as const;

@Injectable()
export class ScoringService {
  /**
   * 依据信号序列计算 MBTI：
   * - 按 side 累加权重；
   * - 逐维比较两侧；
   * - 平局按固定规则取左侧（E/S/T/J），保证输出可重复。
   */
  computeMbtiScores(mode: MbtiMode, signals: readonly MbtiSignal[]): MbtiComputeResult {
    const sideScores: Record<MbtiSide, number> = {
      E: 0,
      I: 0,
      S: 0,
      N: 0,
      T: 0,
      F: 0,
      J: 0,
      P: 0,
    };

    for (const signal of signals) {
      if (!Number.isInteger(signal.weight) || signal.weight < 1 || signal.weight > 3) {
        throw new BadRequestException({
          success: false,
          data: null,
          message: 'signal_weight_out_of_range',
        });
      }
      const allowed = SIDE_BY_DIMENSION[signal.dimension];
      if (!allowed || (signal.side !== allowed[0] && signal.side !== allowed[1])) {
        throw new BadRequestException({
          success: false,
          data: null,
          message: 'signal_side_dimension_mismatch',
        });
      }
      sideScores[signal.side] += signal.weight;
    }

    const ei = this.pickPair(sideScores.E, sideScores.I, 'E', 'I');
    const sn = this.pickPair(sideScores.S, sideScores.N, 'S', 'N');
    const tf = this.pickPair(sideScores.T, sideScores.F, 'T', 'F');
    const jp = this.pickPair(sideScores.J, sideScores.P, 'J', 'P');

    return {
      mode,
      scores: {
        EI: { E: sideScores.E, I: sideScores.I, winner: ei.winner, delta: ei.delta },
        SN: { S: sideScores.S, N: sideScores.N, winner: sn.winner, delta: sn.delta },
        TF: { T: sideScores.T, F: sideScores.F, winner: tf.winner, delta: tf.delta },
        JP: { J: sideScores.J, P: sideScores.P, winner: jp.winner, delta: jp.delta },
      },
      mbti_type: `${ei.winner}${sn.winner}${tf.winner}${jp.winner}`,
    };
  }

  private pickPair<L extends MbtiSide, R extends MbtiSide>(
    left: number,
    right: number,
    l: L,
    r: R,
  ) {
    return {
      winner: left >= right ? l : r,
      delta: Math.abs(left - right),
    };
  }
}
