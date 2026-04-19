/**
 * 密码哈希 round-trip 单元测试。
 */
import { hashPassword, verifyPassword } from './password-crypto';

describe('password-crypto (T1.5)', () => {
  it('hashPassword 可校验且同一明文每次盐不同', async () => {
    const a = await hashPassword('correct-horse-battery');
    const b = await hashPassword('correct-horse-battery');
    expect(a).not.toBe(b);
    expect(await verifyPassword('correct-horse-battery', a)).toBe(true);
    expect(await verifyPassword('wrong', a)).toBe(false);
  });
});
