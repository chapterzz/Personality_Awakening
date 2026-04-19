/**
 * Prisma 生成枚举与任务书/PRD 约定的一致性烟测。
 */
import { AssessmentMode, UserRole } from '@prisma/client';

describe('T1.2 Prisma schema', () => {
  it('exposes User.role enum values (PRD §2.1)', () => {
    expect(UserRole.STUDENT).toBe('STUDENT');
    expect(UserRole.TEACHER).toBe('TEACHER');
    expect(UserRole.ADMIN).toBe('ADMIN');
  });

  it('exposes TestResult.mode enum values (PRD §2.1)', () => {
    expect(AssessmentMode.STANDARD).toBe('STANDARD');
    expect(AssessmentMode.AVG).toBe('AVG');
  });
});
