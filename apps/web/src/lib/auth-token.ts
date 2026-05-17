/**
 * 浏览器端 JWT 与登录用户昵称存取（登录页写入；标准测评续答用 Bearer 调用 `/progress`）。
 */
const STORAGE_KEY = 'ppa_access_token';
const NICKNAME_KEY = 'ppa_user_nickname';

export const AUTH_CHANGED_EVENT = 'ppa-auth-changed';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getStoredNickname(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(NICKNAME_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string, nickname?: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, token);
  if (nickname) {
    window.localStorage.setItem(NICKNAME_KEY, nickname);
  }
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function clearAccessToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(NICKNAME_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
