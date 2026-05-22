/**
 * admin-auth token 存取逻辑单元测试（T4.6）。
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  clearAdminToken,
  getAdminNickname,
  getAdminToken,
  isAdminLoggedIn,
  setAdminToken,
} from '@/lib/admin-auth';

describe('admin-auth', () => {
  afterEach(() => {
    clearAdminToken();
  });

  it('stores and reads admin token separately from student token key', () => {
    expect(isAdminLoggedIn()).toBe(false);
    setAdminToken('admin-jwt-xyz', 'ppa-admin');
    expect(getAdminToken()).toBe('admin-jwt-xyz');
    expect(getAdminNickname()).toBe('ppa-admin');
    expect(isAdminLoggedIn()).toBe(true);
    clearAdminToken();
    expect(getAdminToken()).toBeNull();
  });
});
