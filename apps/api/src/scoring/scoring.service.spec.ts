/**
 * MBTI 计分服务单元测试：验证四维累计、平局规则与非法信号拦截。
 */
import { BadRequestException } from '@nestjs/common';
import { ScoringService } from './scoring.service';

describe('ScoringService', () => {
  const service = new ScoringService();

  it('accumulates weights and maps to mbti_type', () => {
    const out = service.computeMbtiScores('STANDARD', [
      { dimension: 'EI', side: 'E', weight: 2 },
      { dimension: 'EI', side: 'I', weight: 1 },
      { dimension: 'SN', side: 'N', weight: 3 },
      { dimension: 'SN', side: 'S', weight: 1 },
      { dimension: 'TF', side: 'T', weight: 2 },
      { dimension: 'TF', side: 'F', weight: 2 },
      { dimension: 'JP', side: 'P', weight: 3 },
      { dimension: 'JP', side: 'J', weight: 1 },
    ]);

    expect(out.mode).toBe('STANDARD');
    expect(out.scores.EI).toEqual({ E: 2, I: 1, winner: 'E', delta: 1 });
    expect(out.scores.SN).toEqual({ S: 1, N: 3, winner: 'N', delta: 2 });
    expect(out.scores.TF).toEqual({ T: 2, F: 2, winner: 'T', delta: 0 });
    expect(out.scores.JP).toEqual({ J: 1, P: 3, winner: 'P', delta: 2 });
    expect(out.mbti_type).toBe('ENTP');
  });

  it('uses deterministic tie-break rule (EI->E, SN->S, TF->T, JP->J)', () => {
    const out = service.computeMbtiScores('AVG', [
      { dimension: 'EI', side: 'E', weight: 1 },
      { dimension: 'EI', side: 'I', weight: 1 },
      { dimension: 'SN', side: 'S', weight: 2 },
      { dimension: 'SN', side: 'N', weight: 2 },
      { dimension: 'TF', side: 'T', weight: 3 },
      { dimension: 'TF', side: 'F', weight: 3 },
      { dimension: 'JP', side: 'J', weight: 1 },
      { dimension: 'JP', side: 'P', weight: 1 },
    ]);

    expect(out.scores.EI.winner).toBe('E');
    expect(out.scores.SN.winner).toBe('S');
    expect(out.scores.TF.winner).toBe('T');
    expect(out.scores.JP.winner).toBe('J');
    expect(out.mbti_type).toBe('ESTJ');
  });

  it('throws when side does not belong to dimension', () => {
    expect(() =>
      service.computeMbtiScores('STANDARD', [{ dimension: 'EI', side: 'S', weight: 2 }]),
    ).toThrow(BadRequestException);
  });
});
