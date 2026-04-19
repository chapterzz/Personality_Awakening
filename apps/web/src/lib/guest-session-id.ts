/**
 * 游客 `session_id`：首次进入测评时生成并持久化，供 GET/PUT `/progress?session_id=` 使用。
 */
const STORAGE_KEY = 'ppa_guest_session_id';

export function getOrCreateGuestSessionId(): string {
  if (typeof window === 'undefined') {
    throw new Error('guest session id is only available in the browser');
  }
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length > 0) return existing;
    const id = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    const fallback = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    window.localStorage.setItem(STORAGE_KEY, fallback);
    return fallback;
  }
}
