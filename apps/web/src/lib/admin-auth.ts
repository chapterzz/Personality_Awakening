/**
 * Admin JWT 存取（与学生端 token 隔离，T4.6）。
 */
const ADMIN_TOKEN_KEY = 'ppa_admin_access_token';
const ADMIN_NICKNAME_KEY = 'ppa_admin_nickname';

export const ADMIN_AUTH_CHANGED_EVENT = 'ppa-admin-auth-changed';

/** 读取 Admin access token */
export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

/** 读取已登录 Admin 昵称 */
export function getAdminNickname(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(ADMIN_NICKNAME_KEY);
  } catch {
    return null;
  }
}

/** 写入 Admin token 与昵称 */
export function setAdminToken(token: string, nickname?: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  if (nickname) {
    window.localStorage.setItem(ADMIN_NICKNAME_KEY, nickname);
  }
  window.dispatchEvent(new Event(ADMIN_AUTH_CHANGED_EVENT));
}

/** 清除 Admin 登录态 */
export function clearAdminToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  window.localStorage.removeItem(ADMIN_NICKNAME_KEY);
  window.dispatchEvent(new Event(ADMIN_AUTH_CHANGED_EVENT));
}

/** 是否已有 Admin token */
export function isAdminLoggedIn(): boolean {
  return Boolean(getAdminToken());
}
