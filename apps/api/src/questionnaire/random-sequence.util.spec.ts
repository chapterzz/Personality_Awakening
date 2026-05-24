/**
 * random-sequence.util 单测：分层抽样、洗牌、reuse 校验。
 */
import { BadRequestException } from '@nestjs/common';
import {
  DIMENSIONS,
  PER_DIMENSION_COUNT,
  PRESENTED_COUNT,
  groupQuestionsByDimension,
  pickStratifiedRandomIds,
  shuffleArray,
  validateDimensionPools,
  validateReuseIds,
  type QuestionRef,
} from './random-sequence.util';

function mkPool(dim: string, n: number): QuestionRef[] {
  return Array.from({ length: n }, (_, i) => ({ id: `${dim}-${i + 1}`, dimension: dim }));
}

function fullGrouped(perDim: number) {
  return Object.fromEntries(DIMENSIONS.map((d) => [d, mkPool(d, perDim)])) as Record<
    (typeof DIMENSIONS)[number],
    QuestionRef[]
  >;
}

describe('random-sequence.util', () => {
  it('validateDimensionPools throws when pool < 12', () => {
    const grouped = fullGrouped(12);
    grouped.EI = mkPool('EI', 8);
    expect(() => validateDimensionPools(grouped)).toThrow(BadRequestException);
    try {
      validateDimensionPools(grouped);
    } catch (e) {
      expect(e).toMatchObject({
        response: { message: 'insufficient_questions', data: { dimension: 'EI', available: 8 } },
      });
    }
  });

  it('pickStratifiedRandomIds returns 48 unique ids, 12 per dimension', () => {
    const grouped = fullGrouped(24);
    const rng = () => 0;
    const ids = pickStratifiedRandomIds(grouped, rng);
    expect(ids).toHaveLength(PRESENTED_COUNT);
    expect(new Set(ids).size).toBe(PRESENTED_COUNT);
    for (const dim of DIMENSIONS) {
      const dimCount = ids.filter((id) => id.startsWith(`${dim}-`)).length;
      expect(dimCount).toBe(PER_DIMENSION_COUNT);
    }
  });

  it('validateReuseIds rejects wrong length', () => {
    const grouped = fullGrouped(12);
    const all = DIMENSIONS.flatMap((d) => grouped[d]);
    expect(() => validateReuseIds(['a'], all, grouped)).toThrow(BadRequestException);
  });

  it('validateReuseIds returns same ids when valid', () => {
    const grouped = fullGrouped(12);
    const previous = DIMENSIONS.flatMap((d) =>
      grouped[d].slice(0, PER_DIMENSION_COUNT).map((q) => q.id),
    );
    const all = DIMENSIONS.flatMap((d) => grouped[d]);
    expect(validateReuseIds(previous, all, grouped)).toEqual(previous);
  });

  it('shuffleArray permutes with injected rng', () => {
    const input = ['a', 'b', 'c', 'd'];
    const out = shuffleArray([...input], () => 0);
    expect(out).not.toEqual(input);
    expect([...out].sort()).toEqual([...input].sort());
  });

  it('groupQuestionsByDimension ignores unknown dimensions', () => {
    const questions: QuestionRef[] = [
      { id: 'x1', dimension: 'EI' },
      { id: 'x2', dimension: null },
      { id: 'x3', dimension: 'XX' },
    ];
    const grouped = groupQuestionsByDimension(questions);
    expect(grouped.EI).toHaveLength(1);
    expect(grouped.SN).toHaveLength(0);
  });
});
